import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Package, Wallet, LogOut, User } from "lucide-react";
import { useEffect } from "react";

const Profile = () => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-brand-blue/10">
                      <User className="w-12 h-12 text-brand-blue" />
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-xl mb-1">{profile?.username || "Kullanıcı"}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{session?.user?.email}</p>
                  {profile?.verified && (
                    <Badge className="bg-success-green/10 text-success-green">
                      Doğrulanmış
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-glass-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-brand-blue mb-1">
                      <Star className="w-5 h-5 fill-brand-blue" />
                      {Number(profile?.seller_score || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Satıcı Puanı</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-blue mb-1">
                      {profile?.total_sales || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Toplam Satış</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="outline"
                    className="w-full justify-start border-brand-blue text-brand-blue hover:bg-brand-blue/10"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    İlanlarım
                  </Button>
                  <Button
                    onClick={() => navigate("/wallet")}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Bakiye: ₺{Number(profile?.balance || 0).toFixed(2)}
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start text-danger-red hover:bg-danger-red/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Çıkış Yap
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity */}
          <div className="lg:col-span-2">
            <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Son İlanlarım</CardTitle>
              </CardHeader>
              <CardContent>
                {listings && listings.length > 0 ? (
                  <div className="space-y-3">
                    {listings.slice(0, 5).map((listing) => (
                      <div
                        key={listing.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-dark-surface/50 hover:bg-dark-surface transition-colors cursor-pointer"
                        onClick={() => navigate(`/listing/${listing.id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{listing.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>₺{Number(listing.price).toFixed(2)}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {listing.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Henüz ilan oluşturmadınız</p>
                    <Button
                      onClick={() => navigate("/create-listing")}
                      className="mt-4 bg-gradient-to-r from-brand-blue to-primary"
                    >
                      İlan Oluştur
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
