import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: "Kayıt Hatası",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Track IP address for signup
      if (data.session) {
        try {
          await supabase.functions.invoke('track-login', {
            body: { type: 'signup' },
          });
        } catch (err) {
          console.error('Failed to track signup IP:', err);
        }
      }

      toast({
        title: "Başarılı!",
        description: "Kayıt işlemi tamamlandı. Giriş yapabilirsiniz.",
      });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Giriş Hatası",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Track IP address for login
      if (data.session) {
        try {
          await supabase.functions.invoke('track-login', {
            body: { type: 'login' },
          });
        } catch (err) {
          console.error('Failed to track login IP:', err);
        }
      }

      toast({
        title: "Hoş geldiniz!",
        description: "Başarıyla giriş yaptınız.",
      });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-navy p-4">
      <Card className="w-full max-w-md border-glass-border bg-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-blue to-primary flex items-center justify-center shadow-glow-blue">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
            hesapmarket
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Oyun hesapları ve içerikleri için güvenli pazar yeri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-dark-surface">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="signup">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">E-posta</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-dark-surface border-glass-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Şifre</Label>
                  <Input
                    id="password-login"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-dark-surface border-glass-border"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90 shadow-md transition-opacity"
                  disabled={loading}
                >
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">E-posta</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-dark-surface border-glass-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Şifre</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-dark-surface border-glass-border"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90 shadow-md transition-opacity"
                  disabled={loading}
                >
                  {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t border-glass-border">
            <p className="text-xs text-center text-muted-foreground">
              Kayıt olarak{" "}
              <a href="#" className="text-brand-blue hover:underline">
                Kullanım Şartları
              </a>
              {" "}ve{" "}
              <a href="#" className="text-brand-blue hover:underline">
                Gizlilik Politikası
              </a>
              'nı kabul etmiş olursunuz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
