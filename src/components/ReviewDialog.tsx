import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  orderId: string;
  sellerId: string;
  sellerUsername: string;
  existingReview?: {
    rating: number;
    comment: string | null;
  } | null;
}

export const ReviewDialog = ({ orderId, sellerId, sellerUsername, existingReview }: ReviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı");

      const { error } = await supabase
        .from("reviews")
        .insert({
          order_id: orderId,
          reviewer_id: session.user.id,
          reviewed_user_id: sellerId,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast({
        title: "Başarılı",
        description: "Değerlendirmeniz kaydedildi",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen puan verin",
        variant: "destructive",
      });
      return;
    }
    submitReviewMutation.mutate();
  };

  if (existingReview) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= existingReview.rating
                  ? "fill-warning-amber text-warning-amber"
                  : "text-muted"
              }`}
            />
          ))}
        </div>
        <span>Değerlendirdiniz</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Star className="w-4 h-4 mr-2" />
          Değerlendir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sellerUsername} için Değerlendirme</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Puan</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-warning-amber text-warning-amber"
                        : "text-muted"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Yorum (İsteğe Bağlı)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deneyiminizi paylaşın..."
              rows={4}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitReviewMutation.isPending}
            className="w-full"
          >
            {submitReviewMutation.isPending ? "Gönderiliyor..." : "Gönder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
