import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye, FileText, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { format } from "date-fns";
import { ReviewDialog } from "@/components/ReviewDialog";

interface OrderWithDetails {
  id: string;
  created_at: string;
  price: number;
  status: string;
  delivery_note: string | null;
  seller_id: string;
  listing: {
    id: string;
    title: string;
    images: string[] | null;
    auto_delivery: boolean;
    auto_delivery_content: string | null;
  } | null;
  seller_profile: {
    username: string;
    total_sales: number | null;
  } | null;
  seller_role: {
    role: string;
  } | null;
  review: {
    rating: number;
    comment: string | null;
  } | null;
}

const Orders = () => {
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          price,
          status,
          delivery_note,
          listing_id,
          seller_id
        `)
        .eq("buyer_id", session!.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!ordersData) return [];

      // Fetch listing details
      const listingIds = ordersData.map(o => o.listing_id);
      const { data: listingsData } = await supabase
        .from("listings")
        .select("id, title, images, auto_delivery, auto_delivery_content")
        .in("id", listingIds);

      // Fetch seller profiles
      const sellerIds = ordersData.map(o => o.seller_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, username, total_sales")
        .in("user_id", sellerIds);

      // Fetch reviews for these orders
      const orderIds = ordersData.map(o => o.id);
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("order_id, rating, comment")
        .in("order_id", orderIds)
        .eq("reviewer_id", session!.user.id);

      // Fetch seller roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", sellerIds);

      // Merge data
      const enrichedOrders: OrderWithDetails[] = ordersData.map(order => {
        const listing = listingsData?.find(l => l.id === order.listing_id);
        const seller_profile = profilesData?.find(p => p.user_id === order.seller_id);
        const seller_role = rolesData?.find(r => r.user_id === order.seller_id);
        const review = reviewsData?.find(r => r.order_id === order.id);
        return {
          ...order,
          listing: listing || null,
          seller_profile: seller_profile || null,
          seller_role: seller_role || null,
          review: review || null,
        };
      });

      return enrichedOrders;
    },
  });

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Beklemede", className: "bg-warning-amber/10 text-warning-amber" },
      paid: { label: "Ödendi", className: "bg-brand-blue/10 text-brand-blue" },
      delivered: { label: "Teslim Edildi", className: "bg-success-green/10 text-success-green" },
      completed: { label: "Tamamlandı", className: "bg-success-green/10 text-success-green" },
      cancelled: { label: "İptal Edildi", className: "bg-destructive/10 text-destructive" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: "" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Siparişlerim</h1>
          <p className="text-muted-foreground">
            Satın aldığınız ürünler ve sipariş durumları
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-glass-border bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Henüz Sipariş Yok</h3>
                <p className="text-muted-foreground mb-6">
                  Alışverişe başlamak için ilanları inceleyin
                </p>
                <Button
                  onClick={() => navigate("/listings")}
                  className="bg-brand-blue hover:bg-brand-blue/90"
                >
                  İlanları İncele
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-glass-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-md overflow-hidden bg-accent flex-shrink-0">
                        {order.listing?.images && order.listing.images.length > 0 ? (
                          <img
                            src={order.listing.images[0]}
                            alt={order.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1">
                          {order.listing?.title || "İlan Bulunamadı"}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <span>Satıcı: @{order.seller_profile?.username || "kullanıcı"}</span>
                          {order.seller_role?.role === 'admin' && (
                            <img 
                              src="https://cdn.itemsatis.com/uploads/medals/60760ea5cd37a-medals-2644af7bc00efe5566a2154da9c32c4fc8f643fa.png" 
                              alt="Admin Rozeti" 
                              className="w-4 h-4"
                              title="Admin"
                            />
                          )}
                          {(order.seller_profile?.total_sales ?? 0) > 0 && (
                            <img 
                              src="https://cdn.itemsatis.com/uploads/medals/alimmagaza.png" 
                              alt="İlk Satış Rozeti" 
                              className="w-4 h-4"
                              title="İlk satışını yaptı!"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd MMM yyyy, HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-2xl font-bold text-brand-blue mt-2">
                        ₺{Number(order.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Otomatik Teslimat */}
                  {order.listing?.auto_delivery && order.listing.auto_delivery_content && (
                    <div className="p-4 rounded-lg bg-success-green/10 border border-success-green/20">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-success-green" />
                        <h4 className="font-semibold text-success-green">Otomatik Teslimat</h4>
                      </div>
                      <div className="bg-card/50 p-3 rounded border border-glass-border">
                        <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                          {order.listing.auto_delivery_content}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Teslimat Notu */}
                  {order.delivery_note && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-glass-border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-semibold">Teslimat Notu</h4>
                      </div>
                      <p className="text-sm">{order.delivery_note}</p>
                    </div>
                  )}

                  {/* Sipariş Detayları */}
                  {!order.listing?.auto_delivery && !order.delivery_note && order.status === "paid" && (
                    <div className="p-4 rounded-lg bg-warning-amber/10 border border-warning-amber/20 text-sm">
                      <p className="text-warning-amber">
                        Satıcı siparişinizi hazırlıyor. Teslimat bilgileri yakında burada görünecek.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/listing/${order.listing?.id}`)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      İlanı Görüntüle
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/messages?user=${order.seller_profile?.username}`)}
                      className="flex-1"
                    >
                      Satıcıya Mesaj Gönder
                    </Button>
                  </div>

                  {/* Review Button */}
                  {(order.status === 'completed' || order.status === 'delivered') && order.seller_profile && (
                    <div className="pt-2 border-t border-glass-border">
                      <ReviewDialog
                        orderId={order.id}
                        sellerId={order.seller_id}
                        sellerUsername={order.seller_profile.username}
                        existingReview={order.review}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Orders;