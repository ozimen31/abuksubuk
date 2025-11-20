import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Eye, Package } from "lucide-react";
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
  seller_score?: number;
  username?: string;
}

const FeaturedListings = () => {
  const navigate = useNavigate();
  
  const { data: listings, isLoading } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: async () => {
      // Get listings
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);

      if (listingsError) throw listingsError;
      if (!listingsData) return [];

      // Get user profiles for these listings
      const userIds = listingsData.map(l => l.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, username, seller_score")
        .in("user_id", userIds);

      // Merge data
      const enrichedListings: ListingWithProfile[] = listingsData.map(listing => {
        const profile = profilesData?.find(p => p.user_id === listing.user_id);
        return {
          ...listing,
          username: profile?.username,
          seller_score: profile?.seller_score,
        };
      });

      return enrichedListings;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <Card
          key={listing.id}
          onClick={() => navigate(`/listing/${listing.id}`)}
          className="group relative overflow-hidden border-glass-border bg-card/50 backdrop-blur-sm hover:border-neon-blue/50 transition-all cursor-pointer"
        >
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            {listing.images && listing.images.length > 0 ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-blue/10 to-primary/10 flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            {listing.featured && (
              <Badge className="absolute top-2 right-2 bg-gradient-to-r from-brand-blue to-primary shadow-glow-blue">
                Öne Çıkan
              </Badge>
            )}
          </div>

          <CardHeader className="pb-3">
            <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-success-green text-success-green" />
              <span>{Number(listing.seller_score || 0).toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">
                @{listing.username || "kullanıcı"}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-brand-blue">
                ₺{Number(listing.price).toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{listing.view_count}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90 shadow-md">
              Satın Al
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default FeaturedListings;
