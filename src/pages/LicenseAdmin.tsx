import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Key, Shield } from "lucide-react";

const ADMIN_PASSWORD = "1653";

const LicenseAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [keys, setKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success("Giriş başarılı");
      fetchKeys();
    } else {
      toast.error("Yanlış şifre");
    }
  };

  const fetchKeys = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("license_keys")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Anahtarlar yüklenemedi");
    } else {
      setKeys(data || []);
    }
    setIsLoading(false);
  };

  const generateKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 4; i++) {
      if (i > 0) key += "-";
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return key;
  };

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    const newKey = generateKey().toUpperCase();

    const { error } = await supabase
      .from("license_keys")
      .insert({ key_code: newKey });

    if (error) {
      console.error("License key insert failed", error);
      toast.error(error.message || "Anahtar oluşturulamadı");
    } else {
      setGeneratedKey(newKey);
      toast.success("Lisans anahtarı oluşturuldu");
      fetchKeys();
    }
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Panoya kopyalandı");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto text-primary mb-2" />
            <CardTitle>Lisans Yönetimi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Giriş Yap
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Lisans Anahtarı Oluştur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateKey} disabled={isGenerating}>
              {isGenerating ? "Oluşturuluyor..." : "Yeni Anahtar Oluştur"}
            </Button>

            {generatedKey && (
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <code className="text-lg font-mono flex-1">{generatedKey}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(generatedKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mevcut Anahtarlar</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Yükleniyor...</p>
            ) : keys.length === 0 ? (
              <p className="text-muted-foreground">Henüz anahtar yok</p>
            ) : (
              <div className="space-y-2">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <code className="font-mono">{key.key_code}</code>
                      <div className="text-sm text-muted-foreground mt-1">
                        {key.is_active ? (
                          key.activated_at ? (
                            <div className="space-y-1">
                              <span className="text-muted-foreground block">
                                IP: {key.activated_ip || "Bilinmiyor"}
                              </span>
                              <span className="text-xs text-muted-foreground/70">
                                {new Date(key.activated_at).toLocaleString("tr-TR")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-primary">Aktif - Kullanılmadı</span>
                          )
                        ) : (
                          <span className="text-destructive">Pasif</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(key.key_code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LicenseAdmin;
