import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Star, Eye, Package, Search, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Listings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState("newest");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("active", true);
      return data;
    },
  });

  // Set category from URL parameter
  useEffect(() => {
    const categorySlug = searchParams.get("category");
    if (categorySlug && categories) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        setSelectedCategory(category.id);
      }
    }
  }, [searchParams, categories]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings", searchQuery, selectedCategory, priceRange, sortBy],
    queryFn: async () => {
      let query = supabase.from("listings").select("*").eq("status", "active");

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);

      // Always prioritize boosted items
      if (sortBy === "newest") {
        query = query.order("boosted_at", { ascending: false, nullsFirst: false })
                     .order("created_at", { ascending: false });
      } else if (sortBy === "price-asc") {
        query = query.order("boosted_at", { ascending: false, nullsFirst: false })
                     .order("price", { ascending: true });
      } else if (sortBy === "price-desc") {
        query = query.order("boosted_at", { ascending: false, nullsFirst: false })
                     .order("price", { ascending: false });
      } else if (sortBy === "popular") {
        query = query.order("boosted_at", { ascending: false, nullsFirst: false })
                     .order("view_count", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = data?.map((l) => l.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, seller_score, avatar_url, total_sales, is_verified")
        .in("user_id", userIds);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      return data?.map((listing) => ({
        ...listing,
        profile: profiles?.find((p) => p.user_id === listing.user_id),
        seller_role: roles?.find((r) => r.user_id === listing.user_id)?.role,
      }));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* SEO H1 */}
        <h1 className="sr-only">Oyun Hesabı İlanları - Steam, Valorant, LOL ve Daha Fazlası</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">
            <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Filtreler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Arama</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="İlan ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-dark-surface border-glass-border"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Kategori</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-dark-surface border-glass-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Fiyat Aralığı: ₺{priceRange[0]} - ₺{priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={5000}
                    step={50}
                    className="mt-2"
                  />
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sıralama</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-dark-surface border-glass-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">En Yeni</SelectItem>
                      <SelectItem value="popular">En Popüler</SelectItem>
                      <SelectItem value="price-asc">Fiyat (Düşükten Yükseğe)</SelectItem>
                      <SelectItem value="price-desc">Fiyat (Yüksekten Düşüğe)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listings Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
                  Tüm İlanlar
                </span>
              </h1>
              <p className="text-muted-foreground">
                {listings?.length || 0} ilan bulundu
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-96" />
                ))}
              </div>
            ) : listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card
                    key={listing.id}
                    className="group cursor-pointer border-glass-border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-brand-blue/50 hover:shadow-lg transition-all"
                    onClick={() => navigate(`/listing/${listing.id}`)}
                  >
                    <div className="relative h-48 overflow-hidden rounded-t-2xl">
                      {listing.images?.[0] ? (
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
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-brand-blue to-primary">
                          Öne Çıkan
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          {listing.profile?.avatar_url && (
                            <AvatarImage src={listing.profile.avatar_url} />
                          )}
                          <AvatarFallback>
                            <User className="w-3 h-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">@{listing.profile?.username || "kullanıcı"}</span>
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
                        {listing.profile && listing.profile.total_sales >= 10 && (
                          <img 
                            src="https://cdn.itemsatis.com/uploads/medals/itemsatissuperstari.png" 
                            alt="Süper Star" 
                            className="w-4 h-4"
                            title="10+ Satış"
                          />
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{Number(listing.profile?.seller_score || 0).toFixed(1)}</span>
                        </div>
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
                      <Button className="w-full bg-gradient-to-r from-brand-blue to-primary hover:opacity-90">
                        İncele
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">İlan Bulunamadı</h3>
                <p className="text-muted-foreground">Farklı filtreler deneyin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Listings;
