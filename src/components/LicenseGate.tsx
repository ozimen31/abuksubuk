import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Shield } from "lucide-react";

const LICENSE_STORAGE_KEY = "hesap_market_license";
const LICENSE_ADMIN_PATH = "/192.168.1.1";

interface LicenseGateProps {
  children: React.ReactNode;
}

const LicenseGate = ({ children }: LicenseGateProps) => {
  const location = useLocation();
  const [isValidated, setIsValidated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [licenseKey, setLicenseKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Skip license check for admin page
  const isAdminPage = location.pathname === LICENSE_ADMIN_PATH;

  useEffect(() => {
    if (isAdminPage) {
      setIsChecking(false);
      setIsValidated(true);
      return;
    }
    checkStoredLicense();
  }, [isAdminPage]);

  const checkStoredLicense = async () => {
    const storedLicense = localStorage.getItem(LICENSE_STORAGE_KEY);
    
    if (storedLicense) {
      const isValid = await validateLicense(storedLicense, false);
      if (isValid) {
        setIsValidated(true);
      } else {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
      }
    }
    
    setIsChecking(false);
  };

  const validateLicense = async (key: string, activate: boolean = true): Promise<boolean> => {
    const { data, error } = await supabase
      .from("license_keys")
      .select("*")
      .eq("key_code", key.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return false;
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return false;
    }

    // If activating for first time
    if (activate && !data.activated_at) {
      await supabase
        .from("license_keys")
        .update({
          activated_at: new Date().toISOString(),
          activated_by: navigator.userAgent.substring(0, 100),
        })
        .eq("id", data.id);
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licenseKey.trim()) {
      toast.error("Lütfen lisans anahtarını girin");
      return;
    }

    setIsValidating(true);
    
    const isValid = await validateLicense(licenseKey);
    
    if (isValid) {
      localStorage.setItem(LICENSE_STORAGE_KEY, licenseKey.toUpperCase().trim());
      setIsValidated(true);
      toast.success("Lisans doğrulandı!");
    } else {
      toast.error("Geçersiz veya süresi dolmuş lisans anahtarı");
    }
    
    setIsValidating(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isValidated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Hesap Market</CardTitle>
          <CardDescription>
            Siteye erişmek için geçerli bir lisans anahtarı girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                className="pl-10 font-mono text-center tracking-wider"
                maxLength={19}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isValidating}
            >
              {isValidating ? "Doğrulanıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseGate;
