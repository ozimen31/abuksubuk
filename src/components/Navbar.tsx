import { Button } from "@/components/ui/button";
import { User, Menu, X, Wallet, MessageSquare, Package, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const {
    data: session
  } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const {
        data
      } = await supabase.auth.getSession();
      return data.session;
    }
  });
  const {
    data: profile
  } = useQuery({
    queryKey: ["profile", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const {
        data
      } = await supabase.from("profiles").select("*").eq("user_id", session!.user.id).single();
      return data;
    }
  });
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return <nav className={`sticky top-0 z-50 w-full border-b border-glass-border transition-all ${scrolled ? "bg-brand-navy/95 backdrop-blur-lg shadow-lg" : "bg-brand-navy/80 backdrop-blur-sm"}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue to-primary flex items-center justify-center shadow-glow-blue">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
              Hesap Market  
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <Button variant="ghost" className="hover:text-brand-blue" onClick={() => navigate("/")}>
              Anasayfa
            </Button>
            <Button variant="ghost" className="hover:text-brand-blue" onClick={() => navigate("/listings")}>
              <Package className="w-4 h-4 mr-2" />
              İlanlar
            </Button>
            {session && <>
                <Button variant="ghost" className="hover:text-brand-blue" onClick={() => navigate("/wallet")}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Bakiye Yükle
                </Button>
                <Button variant="ghost" className="hover:text-brand-blue" onClick={() => navigate("/withdraw")}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Para Çek
                </Button>
                <Button variant="ghost" className="hover:text-brand-blue" onClick={() => navigate("/messages")}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Mesajlar
                </Button>
              </>}
            <Button variant="ghost" className="hover:text-brand-blue" onClick={() => navigate("/support")}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Destek
            </Button>
          </div>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center gap-3">
            {session ? <>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-glass-border">
                  <Wallet className="w-4 h-4 text-brand-blue" />
                  <span className="font-semibold text-sm">
                    ₺{Number(profile?.balance || 0).toFixed(2)}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/profile")}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full" /> : <User className="w-5 h-5" />}
                </Button>
              </> : <>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="hover:text-brand-blue">
                  Giriş Yap
                </Button>
                <Button onClick={() => navigate("/auth")} className="bg-gradient-to-r from-brand-blue to-primary hover:opacity-90 shadow-md">
                  Kayıt Ol
                </Button>
              </>}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="lg:hidden py-4 space-y-2 border-t border-glass-border animate-fade-in">
            {session && <div className="mb-4 p-3 rounded-lg bg-card border border-glass-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bakiye</span>
                  <span className="font-semibold text-brand-blue">
                    ₺{Number(profile?.balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>}
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/")}>
              Anasayfa
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/listings")}>
              <Package className="w-4 h-4 mr-2" />
              İlanlar
            </Button>
            {session && <>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/wallet")}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Bakiye Yükle
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/withdraw")}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Para Çek
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/messages")}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Mesajlar
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Hesabım
                </Button>
              </>}
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/support")}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Destek
            </Button>
            {!session && <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => {
            navigate("/auth");
            setMobileMenuOpen(false);
          }}>
                  Giriş Yap
                </Button>
                <Button className="w-full bg-gradient-to-r from-brand-blue to-primary" onClick={() => {
            navigate("/auth");
            setMobileMenuOpen(false);
          }}>
                  Kayıt Ol
                </Button>
              </div>}
          </div>}
      </div>
    </nav>;
};
export default Navbar;