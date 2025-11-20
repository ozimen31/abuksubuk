import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet as WalletIcon, CreditCard, ArrowDownToLine, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const Wallet = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [balanceKey, setBalanceKey] = useState("");
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
  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      return data;
    },
  });

  const {
    data: settings
  } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*');
      return data;
    },
  });

  const shopierEnabled = settings?.find(s => s.key === 'shopier_enabled')?.value === 'true';
  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);
  const handleDepositRedirect = () => {
    window.open('https://www.shopier.com/steampanel/41348733', '_blank');
  };
  const handleRedeemKey = async () => {
    if (!balanceKey.trim()) {
      toast({
        title: "Hata",
        description: "Key kodu girin",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('redeem-balance-key', {
        body: {
          key_code: balanceKey.trim()
        }
      });
      if (error) throw error;
      if (data.success) {
        toast({
          title: "Başarılı!",
          description: data.message
        });
        setBalanceKey("");
        // Refresh profile data
        window.location.reload();
      } else {
        toast({
          title: "Hata",
          description: data.error || "Key kullanılamadı",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Bir hata oluştu",
        variant: "destructive"
      });
    }
  };
  return <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
            Cüzdan
          </span>
        </h1>

        {/* Balance Card */}
        <Card className="border-glass-border bg-gradient-to-br from-brand-blue/10 to-primary/10 backdrop-blur-sm mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Mevcut Bakiye</p>
                <p className="text-4xl font-bold text-brand-blue">
                  ₺{Number(profile?.balance || 0).toFixed(2)}
                </p>
              </div>
              <WalletIcon className="w-16 h-16 text-brand-blue opacity-20" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deposit */}
          <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-blue" />
                Bakiye Yükle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-dark-surface/50 text-sm">
                <p className="text-muted-foreground mb-2">💳 Güvenli Ödeme</p>
                <p className="text-xs text-muted-foreground">
                  Güvenli ödeme için Shopier kullanılmaktadır. Butona tıklayarak bakiye yükleme sayfasına yönlendirileceksiniz.
                </p>
              </div>

              <Button 
                onClick={handleDepositRedirect} 
                className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Bakiye Yükle
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Shopier üzerinden güvenli ödeme yapabilirsiniz
              </p>
            </CardContent>
          </Card>

          {/* Balance Key Redeem */}
          <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-blue" />
                Bakiye Key Kullan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="balance-key">Key Kodu</Label>
                <Input 
                  id="balance-key" 
                  type="text" 
                  value={balanceKey} 
                  onChange={e => setBalanceKey(e.target.value.toUpperCase())} 
                  placeholder="BAL-XXXXX-XXXXX" 
                  className="bg-dark-surface border-glass-border font-mono" 
                />
              </div>

              <div className="p-3 rounded-lg bg-dark-surface/50 text-sm">
                <p className="text-muted-foreground mb-2">💡 Bakiye key'i nasıl kullanılır?</p>
                <ol className="text-muted-foreground text-xs space-y-1 list-decimal list-inside">
                  <li>Satın aldığınız key kodunu yukarıya yapıştırın</li>
                  <li>"Key Kullan" butonuna tıklayın</li>
                  <li>Bakiyeniz otomatik olarak yüklenecektir</li>
                </ol>
              </div>

              <Button 
                onClick={handleRedeemKey} 
                className="w-full bg-gradient-to-r from-success-green to-brand-blue hover:opacity-90"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Key Kullan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="border-glass-border bg-card/50 backdrop-blur-sm mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-blue" />
              Son İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Henüz işlem geçmişiniz bulunmuyor</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>;
};
export default Wallet;