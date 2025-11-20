import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBanCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkBanStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Check if user is banned
      const { data: banData } = await supabase
        .from("banned_users")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (banData) {
        // Check if ban has expired
        if (banData.expires_at && new Date(banData.expires_at) < new Date()) {
          // Ban expired, deactivate it
          await supabase
            .from("banned_users")
            .update({ is_active: false })
            .eq("id", banData.id);
          return;
        }

        // User is banned
        toast({
          title: "Hesap Banlandı",
          description: `Hesabınız banlanmıştır. Sebep: ${banData.reason || "Belirtilmemiş"}`,
          variant: "destructive",
          duration: 10000,
        });

        // Sign out user
        await supabase.auth.signOut();
        navigate("/auth");
      }

      // Check profile ban status
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("user_id", user.id)
        .single();

      if (profile?.is_banned) {
        toast({
          title: "Hesap Banlandı",
          description: "Hesabınız banlanmıştır. Lütfen destek ile iletişime geçin.",
          variant: "destructive",
          duration: 10000,
        });

        await supabase.auth.signOut();
        navigate("/auth");
      }
    };

    checkBanStatus();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          checkBanStatus();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);
};
