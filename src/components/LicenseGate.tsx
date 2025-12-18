import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Shield } from "lucide-react";

const LICENSE_STORAGE_KEY = "hesap_market_license";
const LICENSE_IP_KEY = "hesap_market_license_ip";
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
  const [currentIp, setCurrentIp] = useState<string | null>(null);

  // Skip license check for admin page
  const isAdminPage = location.pathname === LICENSE_ADMIN_PATH;

  useEffect(() => {
    if (isAdminPage) {
      setIsChecking(false);
      setIsValidated(true);
      return;
    }
    initializeLicenseCheck();
  }, [isAdminPage]);

  const getClientIp = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("get-client-ip");
      if (error) {
        console.error("Error getting IP from edge function:", error);
        return "unknown";
      }
      return data?.ip || "unknown";
    } catch (error) {
      console.error("Failed to get client IP:", error);
      return "unknown";
    }
  };

  const initializeLicenseCheck = async () => {
    const ip = await getClientIp();
    setCurrentIp(ip);
    console.log("Current IP:", ip);

    const storedLicense = localStorage.getItem(LICENSE_STORAGE_KEY);
    const storedIp = localStorage.getItem(LICENSE_IP_KEY);

    // If IP changed, clear stored license
    if (storedIp && storedIp !== ip) {
      console.log("IP changed, clearing license");
      localStorage.removeItem(LICENSE_STORAGE_KEY);
      localStorage.removeItem(LICENSE_IP_KEY);
      setIsChecking(false);
      return;
    }

    if (storedLicense) {
      const isValid = await validateLicense(storedLicense, false, ip);
      if (isValid) {
        setIsValidated(true);
      } else {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        localStorage.removeItem(LICENSE_IP_KEY);
      }
    }

    setIsChecking(false);
  };

  const normalizeKey = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const formatKey = (normalized: string) => {
    const groups = normalized.match(/.{1,4}/g);
    return groups ? groups.join("-") : normalized;
  };

  const validateLicense = async (rawKey: string, activate: boolean = true, ip: string): Promise<boolean> => {
    const normalized = normalizeKey(rawKey);
    if (normalized.length !== 16) return false;

    const key = formatKey(normalized);

    const { data, error } = await supabase
      .from("license_keys")
      .select("*")
      .eq("key_code", key)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      console.warn("License validation failed", { key, error });
      return false;
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return false;
    }

    // Check if already activated by different IP
    if (data.activated_ip && data.activated_ip !== ip) {
      console.warn("License already used by different IP", { 
        key, 
        activatedIp: data.activated_ip, 
        currentIp: ip 
      });
      toast.error("Bu lisans başka bir IP adresinde kullanılıyor");
      return false;
    }

    // If activating for first time
    if (activate && !data.activated_at) {
      const { error: updateError } = await supabase
        .from("license_keys")
        .update({
          activated_at: new Date().toISOString(),
          activated_by: navigator.userAgent.substring(0, 100),
          activated_ip: ip,
        })
        .eq("id", data.id);

      if (updateError) {
        console.warn("License activation update failed", { key, updateError });
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = normalizeKey(licenseKey);

    if (normalized.length !== 16) {
      toast.error("Lisans anahtarı 16 karakter olmalı (XXXX-XXXX-XXXX-XXXX)");
      return;
    }

    const formatted = formatKey(normalized);

    if (!currentIp) {
      toast.error("IP adresi alınamadı, lütfen tekrar deneyin");
      return;
    }

    setIsValidating(true);

    const isValid = await validateLicense(formatted, true, currentIp);

    if (isValid) {
      localStorage.setItem(LICENSE_STORAGE_KEY, formatted);
      localStorage.setItem(LICENSE_IP_KEY, currentIp);
      setLicenseKey(formatted);
      setIsValidated(true);
      toast.success("Lisans doğrulandı!");
    } else {
      toast.error("Geçersiz, süresi dolmuş veya başka IP'de kullanılan lisans anahtarı");
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
          {currentIp && (
            <p className="text-xs text-muted-foreground">IP: {currentIp}</p>
          )}
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
