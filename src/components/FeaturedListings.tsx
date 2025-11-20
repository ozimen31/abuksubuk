import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Eye, Package, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface ListingWithProfile {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[] | null;
  featured: boolean;
  view_count: number;
  user_id: string;
  profile?: {
    seller_score: number;
    username: string;
    avatar_url: string | null;
    total_sales: number;
    is_verified: boolean | null;
  };
  seller_role?: string | null;
}

const FeaturedListings = () => {
  const navigate = useNavigate();
  
  const { data: listings, isLoading } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: async () => {
      const { data: listingsData, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .order("boosted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!listingsData) return [];

      // Get user profiles for these listings
      const userIds = listingsData.map(l => l.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, username, seller_score, avatar_url, total_sales, is_verified")
        .in("user_id", userIds);

      // Get user roles for these listings
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Merge data
      const enrichedListings: ListingWithProfile[] = listingsData.map(listing => {
        const profile = profilesData?.find(p => p.user_id === listing.user_id);
        const userRole = rolesData?.find(r => r.user_id === listing.user_id);
        return {
          ...listing,
          profile: profile ? {
            username: profile.username,
            seller_score: profile.seller_score || 0,
            avatar_url: profile.avatar_url,
            total_sales: profile.total_sales || 0,
            is_verified: profile.is_verified || false,
          } : undefined,
          seller_role: userRole?.role || null,
        };
      });

      return enrichedListings;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <CardHeader className="p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Henüz İlan Yok</h3>
        <p className="text-muted-foreground">İlk ilanı siz oluşturun!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {listings.map((listing) => (
        <Card
          key={listing.id}
          className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-glass-border bg-card/50 backdrop-blur-sm group"
          onClick={() => navigate(`/listing/${listing.id}`)}
        >
          <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-brand-blue/5 to-primary/5">
            {listing.images?.[0] ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}
            {listing.featured && (
              <Badge className="absolute top-2 right-2 bg-brand-blue text-white text-xs">
                Öne Çıkan
              </Badge>
            )}
          </div>

          <CardContent className="p-3">
            <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors">
              {listing.title}
            </h3>

            <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
              <Avatar className="w-5 h-5">
                {listing.profile?.avatar_url && (
                  <AvatarImage src={listing.profile.avatar_url} />
                )}
                <AvatarFallback>
                  <User className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{listing.profile?.username || 'Kullanıcı'}</span>
              {listing.profile?.is_verified && (
                <img 
                  src="https://cdn.itemsatis.com/uploads/medals/60760ea5cd37a-medals-2644af7bc00efe5566a2154da9c32c4fc8f643fa.png" 
                  alt="Verified" 
                  className="w-4 h-4"
                  title="Doğrulanmış Hesap"
                />
              )}
              {listing.seller_role === 'admin' && (
                <img 
                  src="https://cdn.itemsatis.com/uploads/medals/60760ea5cd37a-medals-2644af7bc00efe5566a2154da9c32c4fc8f643fa.png" 
                  alt="Admin" 
                  className="w-4 h-4"
                  title="Admin"
                />
              )}
              {listing.profile && listing.profile.total_sales > 0 && (
                <img 
                  src="https://cdn.itemsatis.com/uploads/medals/alimmagaza.png" 
                  alt="İlk Satış" 
                  className="w-4 h-4"
                  title="İlk Satış"
                />
              )}
              <div className="flex items-center gap-0.5 ml-auto">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{Number(listing.profile?.seller_score || 0).toFixed(1)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xl font-bold text-brand-blue">
                  ₺{Number(listing.price).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />
                <span>{listing.view_count}</span>
              </div>
            </div>

            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/listing/${listing.id}`);
              }}
            >
              Satın Al
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeaturedListings;
