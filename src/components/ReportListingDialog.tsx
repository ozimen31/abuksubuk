import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ReportListingDialogProps {
  listingId: string;
  listingTitle: string;
}

export const ReportListingDialog = ({ listingId, listingTitle }: ReportListingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Hata",
        description: "Lütfen bir rapor nedeni seçin",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: "Giriş Yapın",
          description: "Rapor göndermek için giriş yapmanız gerekiyor",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("reports").insert({
        reporter_id: session.session.user.id,
        listing_id: listingId,
        reason,
        details,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Rapor Gönderildi",
        description: "Raporunuz başarıyla gönderildi. En kısa sürede incelenecektir.",
      });

      setOpen(false);
      setReason("");
      setDetails("");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    } catch (error) {
      console.error("Report error:", error);
      toast({
        title: "Hata",
        description: "Rapor gönderilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Flag className="w-4 h-4 mr-2" />
          Rapor Et
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İlan Rapor Et</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">İlan: {listingTitle}</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Rapor Nedeni</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Bir neden seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scam">Dolandırıcılık</SelectItem>
                <SelectItem value="fake">Sahte Ürün</SelectItem>
                <SelectItem value="inappropriate">Uygunsuz İçerik</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Detaylar (Opsiyonel)</Label>
            <Textarea
              id="details"
              placeholder="Rapor hakkında ek bilgi verin..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90"
          >
            {isSubmitting ? "Gönderiliyor..." : "Rapor Gönder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
