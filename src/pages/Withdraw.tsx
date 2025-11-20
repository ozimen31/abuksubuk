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
import { Wallet as WalletIcon, ArrowDownToLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankIban, setBankIban] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
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
      
      // Auto-fill bank details if available
      if (data) {
        setBankName(data.bank_name || "");
        setBankAccountHolder(data.bank_account_holder || "");
        setBankIban(data.bank_iban || "");
      }
      
      return data;
    },
  });

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Hata",
        description: "Geçerli bir tutar girin",
        variant: "destructive",
      });
      return;
    }

    if (!bankName || !bankAccountHolder || !bankIban) {
      toast({
        title: "Hata",
        description: "Lütfen tüm banka bilgilerini doldurun",
        variant: "destructive",
      });
      return;
    }

    // Basic IBAN validation (TR + 24 digits)
    const ibanClean = bankIban.replace(/\s/g, '').toUpperCase();
    if (!ibanClean.startsWith('TR') || ibanClean.length !== 26) {
      toast({
        title: "Hata",
        description: "Geçerli bir TR IBAN giriniz (TR + 24 hane)",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(withdrawAmount) < 50) {
      toast({
        title: "Hata",
        description: "Minimum çekim tutarı 50 TL'dir",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(withdrawAmount) > (profile?.balance || 0)) {
      toast({
        title: "Hata",
        description: "Yetersiz bakiye",
        variant: "destructive",
      });
      return;
    }

    try {
      // First update bank details in profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          bank_name: bankName,
          bank_account_holder: bankAccountHolder,
          bank_iban: ibanClean,
        })
        .eq("user_id", session!.user.id);

      if (profileError) throw profileError;

      // Then create withdrawal request
      const { error } = await supabase.from("withdrawals").insert({
        user_id: session!.user.id,
        amount: parseFloat(withdrawAmount),
        status: "pending",
        notes: `Banka: ${bankName}\nHesap Sahibi: ${bankAccountHolder}\nIBAN: ${ibanClean}`,
      });

      if (error) throw error;

      toast({
        title: "Çekim Talebi Oluşturuldu",
        description: "Çekim talebiniz admin onayına gönderildi.",
      });
      setWithdrawAmount("");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
            Para Çek
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

        <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-brand-blue" />
              Para Çekme Talebi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bank-name">Banka Adı *</Label>
              <Input
                id="bank-name"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Örn: Ziraat Bankası"
                className="bg-dark-surface border-glass-border"
                required
              />
            </div>

            <div>
              <Label htmlFor="account-holder">Hesap Sahibi Adı *</Label>
              <Input
                id="account-holder"
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                placeholder="Ad Soyad"
                className="bg-dark-surface border-glass-border"
                required
              />
            </div>

            <div>
              <Label htmlFor="iban">IBAN *</Label>
              <Input
                id="iban"
                type="text"
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="bg-dark-surface border-glass-border font-mono"
                maxLength={32}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                IBAN numaranızı boşluklu veya boşluksuz girebilirsiniz
              </p>
            </div>

            <div className="border-t border-glass-border pt-4">
              <Label htmlFor="withdraw-amount">Çekilecek Tutar (₺) *</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="bg-dark-surface border-glass-border"
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-dark-surface/50 text-sm space-y-2">
              <p className="text-muted-foreground">Minimum çekim: ₺50.00</p>
              <p className="text-muted-foreground">
                Maksimum çekilebilir: ₺{Number(profile?.balance || 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Banka bilgileriniz güvenli şekilde kaydedilir ve sonraki çekimlerde otomatik doldurulur.
              </p>
            </div>

            <Button
              onClick={handleWithdraw}
              className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90"
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Çekim Talebi Oluştur
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Çekim talepleri admin onayı sonrası 1-3 iş günü içinde işleme alınır
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Withdraw;
