import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, CheckCircle, Clock } from "lucide-react";

export default function VerifyAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tcNo, setTcNo] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  const { data: existingRequest, isLoading } = useQuery({
    queryKey: ["verification-request", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const submitRequestMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("Oturum açmanız gerekiyor");
      
      const { error } = await supabase
        .from("verification_requests")
        .insert({
          user_id: session.user.id,
          first_name: firstName,
          last_name: lastName,
          tc_no: tcNo,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Doğrulama talebiniz gönderildi. Yönetici onayı bekleniyor.",
      });
      queryClient.invalidateQueries({ queryKey: ["verification-request"] });
      navigate("/profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !tcNo) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    if (tcNo.length !== 11) {
      toast({
        title: "Hata",
        description: "TC Kimlik No 11 haneli olmalıdır",
        variant: "destructive",
      });
      return;
    }

    submitRequestMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">Yükleniyor...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (existingRequest) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {existingRequest.status === "approved" ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    Hesabınız Doğrulandı
                  </>
                ) : existingRequest.status === "rejected" ? (
                  <>
                    <Shield className="h-6 w-6 text-destructive" />
                    Doğrulama Talebi Reddedildi
                  </>
                ) : (
                  <>
                    <Clock className="h-6 w-6 text-yellow-500" />
                    Doğrulama Talebi Beklemede
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {existingRequest.status === "approved" && "Hesabınız başarıyla doğrulandı."}
                {existingRequest.status === "rejected" && `Red nedeni: ${existingRequest.admin_notes || "Belirtilmedi"}`}
                {existingRequest.status === "pending" && "Talebiniz yönetici onayı bekliyor."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Ad:</strong> {existingRequest.first_name}</p>
                <p><strong>Soyad:</strong> {existingRequest.last_name}</p>
                <p><strong>Talep Tarihi:</strong> {new Date(existingRequest.created_at).toLocaleDateString("tr-TR")}</p>
              </div>
              <Button onClick={() => navigate("/profile")} className="mt-6 w-full">
                Profile Dön
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Hesap Doğrulama
            </CardTitle>
            <CardDescription>
              Hesabınızı doğrulamak için lütfen bilgilerinizi girin. Doğrulama sonrasında profilinizde özel rozet görünecektir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Adınız"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Soyadınız"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tcNo">TC Kimlik No</Label>
                <Input
                  id="tcNo"
                  value={tcNo}
                  onChange={(e) => setTcNo(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="TC Kimlik Numaranız"
                  maxLength={11}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitRequestMutation.isPending}>
                {submitRequestMutation.isPending ? "Gönderiliyor..." : "Doğrulama Talebi Gönder"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
