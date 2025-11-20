--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: listing_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.listing_status AS ENUM (
    'draft',
    'active',
    'sold',
    'paused',
    'rejected'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'paid',
    'delivered',
    'completed',
    'disputed',
    'cancelled'
);


--
-- Name: ticket_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_priority AS ENUM (
    'low',
    'normal',
    'high'
);


--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_status AS ENUM (
    'open',
    'answered',
    'closed'
);


--
-- Name: withdrawal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.withdrawal_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'completed'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, balance, seller_score, total_sales)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text),
    0,
    0,
    0
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: balance_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balance_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_code text NOT NULL,
    amount numeric NOT NULL,
    used boolean DEFAULT false NOT NULL,
    used_by uuid,
    used_at timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    description text,
    CONSTRAINT balance_keys_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    description text,
    order_index integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    price numeric(12,2) NOT NULL,
    category_id uuid,
    platform text,
    tags text[],
    stock integer DEFAULT 1,
    status public.listing_status DEFAULT 'draft'::public.listing_status,
    images text[],
    featured boolean DEFAULT false,
    auto_delivery boolean DEFAULT false,
    auto_delivery_content text,
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    order_id uuid,
    body text NOT NULL,
    attachments text[],
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.messages REPLICA IDENTITY FULL;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    listing_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    price numeric(12,2) NOT NULL,
    commission numeric(12,2) NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status,
    payment_method text,
    payment_txn text,
    escrow_until timestamp with time zone,
    delivered_at timestamp with time zone,
    completed_at timestamp with time zone,
    delivery_note text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    username text,
    avatar_url text,
    description text,
    seller_score numeric(3,2) DEFAULT 0.00,
    total_sales integer DEFAULT 0,
    balance numeric(12,2) DEFAULT 0.00,
    verified boolean DEFAULT false,
    phone text,
    bank_name text,
    bank_account_holder text,
    bank_iban text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    reporter_id uuid NOT NULL,
    reported_user_id uuid,
    listing_id uuid,
    order_id uuid,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text,
    admin_notes text,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewed_user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    key text NOT NULL,
    value text,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: slider_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slider_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    button_text text,
    button_link text,
    order_index integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    is_admin_reply boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subject text NOT NULL,
    status public.ticket_status DEFAULT 'open'::public.ticket_status NOT NULL,
    priority public.ticket_priority DEFAULT 'normal'::public.ticket_priority NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    closed_by uuid
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    status public.withdrawal_status DEFAULT 'pending'::public.withdrawal_status,
    method text DEFAULT 'bank_transfer'::text,
    notes text,
    admin_notes text,
    processed_by uuid,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: balance_keys balance_keys_key_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_keys
    ADD CONSTRAINT balance_keys_key_code_key UNIQUE (key_code);


--
-- Name: balance_keys balance_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_keys
    ADD CONSTRAINT balance_keys_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_order_id_reviewer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_reviewer_id_key UNIQUE (order_id, reviewer_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_key UNIQUE (key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: slider_images slider_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slider_images
    ADD CONSTRAINT slider_images_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: profiles unique_user_profile; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT unique_user_profile UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_balance_keys_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_balance_keys_code ON public.balance_keys USING btree (key_code);


--
-- Name: idx_balance_keys_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_balance_keys_used ON public.balance_keys USING btree (used, expires_at);


--
-- Name: listings update_listings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: slider_images update_slider_images_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_slider_images_updated_at BEFORE UPDATE ON public.slider_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_tickets update_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: listings listings_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: listings listings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: messages messages_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: messages messages_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: orders orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id);


--
-- Name: orders orders_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: orders orders_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: reports reports_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: reports reports_reported_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES auth.users(id);


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id);


--
-- Name: reports reports_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: reviews reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: reviews reviews_reviewed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewed_user_id_fkey FOREIGN KEY (reviewed_user_id) REFERENCES auth.users(id);


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id);


--
-- Name: support_messages support_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: withdrawals withdrawals_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES auth.users(id);


--
-- Name: withdrawals withdrawals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: listings Active listings are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active listings are viewable by everyone" ON public.listings FOR SELECT USING (((status = 'active'::public.listing_status) OR (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: slider_images Active sliders are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active sliders are viewable by everyone" ON public.slider_images FOR SELECT USING (((active = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: balance_keys Admins can create balance keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create balance keys" ON public.balance_keys FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (auth.uid() = created_by)));


--
-- Name: reports Admins can manage reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage reports" ON public.reports FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_messages Admins can send messages to any ticket; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can send messages to any ticket" ON public.support_messages FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (is_admin_reply = true)));


--
-- Name: balance_keys Admins can update balance keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update balance keys" ON public.balance_keys FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_tickets Admins can update tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update tickets" ON public.support_tickets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: withdrawals Admins can update withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update withdrawals" ON public.withdrawals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: balance_keys Admins can view all balance keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all balance keys" ON public.balance_keys FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Buyers can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: categories Categories are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);


--
-- Name: categories Only admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage categories" ON public.categories USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_settings Only admins can manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage settings" ON public.site_settings USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.jwt() IS NULL)));


--
-- Name: slider_images Only admins can manage sliders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage sliders" ON public.slider_images USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: reviews Reviews are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);


--
-- Name: site_settings Settings are viewable by admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Settings are viewable by admins" ON public.site_settings FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.jwt() IS NULL)));


--
-- Name: user_roles User roles are viewable by owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User roles are viewable by owner" ON public.user_roles FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: reports Users can create reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK ((auth.uid() = reporter_id));


--
-- Name: reviews Users can create reviews for their orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews for their orders" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = reviewer_id));


--
-- Name: listings Users can create their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own listings" ON public.listings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_tickets Users can create tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: withdrawals Users can create withdrawal requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create withdrawal requests" ON public.withdrawals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: listings Users can delete their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own listings" ON public.listings FOR DELETE USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: messages Users can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = from_user_id));


--
-- Name: support_messages Users can send messages to their tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages to their tickets" ON public.support_messages FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND (support_tickets.user_id = auth.uid()))))));


--
-- Name: listings Users can update their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own listings" ON public.listings FOR UPDATE USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: orders Users can update their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: messages Users can update their received messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their received messages" ON public.messages FOR UPDATE USING ((auth.uid() = to_user_id));


--
-- Name: messages Users can view their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (((auth.uid() = from_user_id) OR (auth.uid() = to_user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: orders Users can view their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: reports Users can view their own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (((auth.uid() = reporter_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: support_tickets Users can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: withdrawals Users can view their own withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: support_messages Users can view their ticket messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their ticket messages" ON public.support_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND ((support_tickets.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));


--
-- Name: balance_keys Users can view their used keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their used keys" ON public.balance_keys FOR SELECT USING (((used = true) AND (used_by = auth.uid())));


--
-- Name: balance_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.balance_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: listings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: slider_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.slider_images ENABLE ROW LEVEL SECURITY;

--
-- Name: support_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: withdrawals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


