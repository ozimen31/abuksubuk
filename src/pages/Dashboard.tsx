import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Eye, Edit, Trash2, TrendingUp, Wallet } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["my-listings", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", session!.user.id)
        .order("created_at", { ascending: false });
      return data;
    },
  });

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const stats = {
    totalListings: listings?.length || 0,
    activeListings: listings?.filter((l) => l.status === "active").length || 0,
    totalViews: listings?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0,
    balance: profile?.balance || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <Button
            onClick={() => navigate("/create-listing")}
            className="bg-gradient-to-r from-brand-blue to-primary hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni İlan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam İlan</p>
                  <p className="text-2xl font-bold">{stats.totalListings}</p>
                </div>
                <Package className="w-8 h-8 text-brand-blue" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktif İlan</p>
                  <p className="text-2xl font-bold">{stats.activeListings}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Görüntülenme</p>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                </div>
                <Eye className="w-8 h-8 text-brand-blue" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bakiye</p>
                  <p className="text-2xl font-bold text-brand-blue">
                    ₺{Number(stats.balance).toFixed(2)}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-brand-blue" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>İlanlarım</CardTitle>
          </CardHeader>
          <CardContent>
            {listings && listings.length > 0 ? (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-dark-surface/50 hover:bg-dark-surface transition-colors"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-blue/10 to-primary/10 flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{listing.title}</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-brand-blue">
                          ₺{Number(listing.price).toFixed(2)}
                        </span>
                        <Badge
                          variant={listing.status === "active" ? "default" : "secondary"}
                          className={listing.status === "active" ? "bg-success-green/10 text-success-green" : ""}
                        >
                          {listing.status}
                        </Badge>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {listing.view_count}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/listing/${listing.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/edit-listing/${listing.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-danger-red">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Henüz ilan oluşturmadınız</p>
                <Button
                  onClick={() => navigate("/create-listing")}
                  className="bg-gradient-to-r from-brand-blue to-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  İlk İlanını Oluştur
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
