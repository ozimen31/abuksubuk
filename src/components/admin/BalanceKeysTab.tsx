import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BalanceKeysTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    expires_at: "",
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: keys, isLoading } = useQuery({
    queryKey: ["admin-balance-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("balance_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const generateKeyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!session?.user?.id) throw new Error("Oturum bulunamadı");
      
      const keyCode = `BK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      const { error } = await supabase.from("balance_keys").insert({
        key_code: keyCode,
        amount: parseFloat(data.amount),
        description: data.description || null,
        expires_at: data.expires_at || null,
        created_by: session.user.id,
      });
      
      if (error) throw error;
      return keyCode;
    },
    onSuccess: (keyCode) => {
      toast({
        title: "Başarılı",
        description: `Bakiye anahtarı oluşturuldu: ${keyCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-balance-keys"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: "",
      description: "",
      expires_at: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Hata",
        description: "Geçerli bir tutar giriniz",
        variant: "destructive",
      });
      return;
    }

    generateKeyMutation.mutate(formData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı",
      description: "Anahtar panoya kopyalandı",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bakiye Anahtarı Yönetimi</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Anahtar Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Bakiye Anahtarı Oluştur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Tutar (₺) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="100.00"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Promosyon anahtarı..."
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">Son Kullanma Tarihi (İsteğe Bağlı)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Oluştur
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anahtar Kodu</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Son Kullanma</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys && keys.length > 0 ? (
                  keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-mono font-medium">
                        {key.key_code}
                      </TableCell>
                      <TableCell>{key.amount} ₺</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {key.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.used ? "secondary" : "default"}>
                          {key.used ? "Kullanıldı" : "Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {key.expires_at
                          ? new Date(key.expires_at).toLocaleDateString("tr-TR")
                          : "Süresiz"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(key.key_code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Henüz anahtar oluşturulmamış
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceKeysTab;
