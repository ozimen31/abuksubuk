import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Eye, Shield, MessageSquare, User, Package, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ReportListingDialog } from "@/components/ReportListingDialog";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data: listingData, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!listingData) return null;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", listingData.user_id)
        .maybeSingle();

      const { data: categoryData } = await supabase
        .from("categories")
        .select("*")
        .eq("id", listingData.category_id)
        .maybeSingle();

      // Fetch seller role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", listingData.user_id)
        .maybeSingle();

      // Increment view count
      await supabase
        .from("listings")
        .update({ view_count: (listingData.view_count || 0) + 1 })
        .eq("id", id);

      return { ...listingData, profile: profileData, category: categoryData, seller_role: roleData };
    },
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*');
      return data;
    },
  });

  const shopierEnabled = settings?.find(s => s.key === 'shopier_enabled')?.value === 'true';

  const handleSendMessage = () => {
    if (!session) {
      toast({
        title: "Giriş Yapın",
        description: "Mesaj göndermek için giriş yapmanız gerekiyor",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (session.user.id === listing.user_id) {
      toast({
        title: "Hata",
        description: "Kendinize mesaj gönderemezsiniz",
        variant: "destructive",
      });
      return;
    }

    navigate(`/messages?user=${listing.user_id}`);
  };

  const handlePurchaseWithBalance = async () => {
    if (!session) {
      toast({
        title: "Giriş Yapın",
        description: "Satın alma işlemi için giriş yapmanız gerekiyor",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (session.user.id === listing.user_id) {
      toast({
        title: "Hata",
        description: "Kendi ilanınızı satın alamazsınız",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "İşleniyor",
        description: "Lütfen bekleyin...",
      });

      const { data, error } = await supabase.functions.invoke('purchase-with-balance', {
        body: {
          listing_id: listing.id,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Başarılı!",
          description: "Satın alma işlemi tamamlandı",
        });
        navigate('/dashboard');
      } else {
        throw new Error(data?.error || 'Satın alma işlemi başarısız');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Hata",
        description: error.message || "Bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async () => {
    if (!session) {
      toast({
        title: "Giriş Yapın",
        description: "Satın alma işlemi için giriş yapmanız gerekiyor",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (session.user.id === listing.user_id) {
      toast({
        title: "Hata",
        description: "Kendi ilanınızı satın alamazsınız",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Ödeme Hazırlanıyor",
        description: "Lütfen bekleyin...",
      });

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: session.user.id,
          seller_id: listing.user_id,
          listing_id: listing.id,
          price: listing.price,
          commission: listing.price * 0.1,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error('Sipariş oluşturulamadı');
      }

      // Call Shopier payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('shopier-payment', {
        body: {
          amount: listing.price.toString(),
          user_id: session.user.id,
          listing_id: listing.id,
        }
      });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        throw new Error(paymentError.message || 'Ödeme işlemi başlatılamadı');
      }

      if (paymentData?.payment_url) {
        window.location.href = paymentData.payment_url;
      } else {
        throw new Error(paymentData?.error || 'Ödeme bağlantısı alınamadı');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Ödeme Hatası",
        description: error.message || "Bir hata oluştu, lütfen tekrar deneyin",
        variant: "destructive",
      });
    }
  };

  const handleMessage = () => {
    navigate("/messages");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">İlan Bulunamadı</h2>
          <Button onClick={() => navigate("/listings")}>İlanlara Dön</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-glass-border bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="aspect-video relative overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[selectedImage]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-blue/10 to-primary/10 flex items-center justify-center">
                    <Package className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              {listing.images && listing.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? "border-brand-blue" : "border-glass-border"
                      }`}
                    >
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Açıklama</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
                
                {listing.tags && listing.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {listing.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Purchase Info */}
          <div className="space-y-4">
            <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{listing.title}</CardTitle>
                    {listing.category && (
                      <Badge className="bg-brand-blue/10 text-brand-blue">
                        {listing.category.name}
                      </Badge>
                    )}
                  </div>
                  {listing.featured && (
                    <Badge className="bg-gradient-to-r from-brand-blue to-primary">
                      Öne Çıkan
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold text-brand-blue">
                  ₺{Number(listing.price).toFixed(2)}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{listing.view_count} görüntülenme</span>
                  </div>
                  {listing.platform && (
                    <Badge variant="outline">{listing.platform}</Badge>
                  )}
                </div>

                <Separator />

                {session && userProfile && (
                  <div className="p-3 rounded-lg bg-brand-blue/10 border border-brand-blue/30">
                    <p className="text-sm text-muted-foreground mb-1">Mevcut Bakiyeniz</p>
                    <p className="text-2xl font-bold text-brand-blue">
                      ₺{Number(userProfile.balance || 0).toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {session ? (
                    <>
                      <Button
                        onClick={handlePurchaseWithBalance}
                        className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90 shadow-glow-blue"
                        size="lg"
                        disabled={!userProfile || userProfile.balance < listing.price}
                      >
                        <Shield className="w-5 h-5 mr-2" />
                        {userProfile && userProfile.balance < listing.price 
                          ? "Yetersiz Bakiye" 
                          : "Bakiye ile Satın Al"}
                      </Button>
                      
                      {shopierEnabled && (
                        <Button
                          onClick={handlePurchase}
                          variant="outline"
                          className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                          size="lg"
                        >
                          <CreditCard className="w-5 h-5 mr-2" />
                          Shopier ile Satın Al
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={() => navigate('/auth')}
                      className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90"
                      size="lg"
                    >
                      Satın Almak İçin Giriş Yapın
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleSendMessage}
                    variant="outline"
                    className="w-full border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                    size="lg"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Satıcıya Mesaj
                  </Button>

                  <ReportListingDialog 
                    listingId={listing.id}
                    listingTitle={listing.title}
                  />
                </div>

                <Separator />

                {/* Seller Info */}
                <div>
                  <h3 className="font-semibold mb-3">Satıcı Bilgileri</h3>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50">
                    <Avatar>
                      <AvatarImage src={listing.profile?.avatar_url} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{listing.profile?.username || "Kullanıcı"}</p>
                        {listing.seller_role?.role === 'admin' && (
                          <img 
                            src="https://cdn.itemsatis.com/uploads/medals/60760ea5cd37a-medals-2644af7bc00efe5566a2154da9c32c4fc8f643fa.png" 
                            alt="Admin Rozeti" 
                            className="w-5 h-5"
                            title="Admin"
                          />
                        )}
                        {(listing.profile?.total_sales ?? 0) > 0 && (
                          <img 
                            src="https://cdn.itemsatis.com/uploads/medals/alimmagaza.png" 
                            alt="İlk Satış Rozeti" 
                            className="w-5 h-5"
                            title="İlk satışını yaptı!"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-success-green text-success-green" />
                        <span>{Number(listing.profile?.seller_score || 0).toFixed(2)}</span>
                        <span className="text-muted-foreground">
                          ({listing.profile?.total_sales || 0} satış)
                        </span>
                      </div>
                    </div>
                    {listing.profile?.verified && (
                      <Badge className="bg-success-green/10 text-success-green">
                        Doğrulanmış
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-brand-blue" />
                  <span>Shopier Güvencesi</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-brand-blue" />
                  <span>Escrow Koruma Sistemi</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-brand-blue" />
                  <span>7/24 Destek</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ListingDetail;
