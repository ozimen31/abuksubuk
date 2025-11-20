import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, TrendingUp, Wallet, AlertCircle } from "lucide-react";

const DashboardTab = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, listingsRes, ordersRes, withdrawalsRes, reportsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id, status", { count: "exact" }),
        supabase.from("orders").select("id, price, status", { count: "exact" }),
        supabase.from("withdrawals").select("amount, status"),
        supabase.from("reports").select("id, status", { count: "exact", head: true }),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => {
        if (order.status === "completed") {
          return sum + Number(order.price);
        }
        return sum;
      }, 0) || 0;

      const pendingWithdrawals = withdrawalsRes.data?.filter(w => w.status === "pending").length || 0;
      const activeListings = listingsRes.data?.filter(l => l.status === "active").length || 0;
      const pendingOrders = ordersRes.data?.filter(o => o.status === "pending").length || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalListings: listingsRes.count || 0,
        activeListings,
        totalOrders: ordersRes.count || 0,
        pendingOrders,
        totalRevenue,
        pendingWithdrawals,
        totalReports: reportsRes.count || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Toplam Kullanıcı",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Toplam İlan",
      value: stats?.totalListings || 0,
      description: `${stats?.activeListings || 0} aktif`,
      icon: Package,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Toplam Sipariş",
      value: stats?.totalOrders || 0,
      description: `${stats?.pendingOrders || 0} beklemede`,
      icon: ShoppingCart,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Toplam Gelir",
      value: `${stats?.totalRevenue.toFixed(2) || 0} ₺`,
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Bekleyen Çekim",
      value: stats?.pendingWithdrawals || 0,
      icon: Wallet,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Toplam Rapor",
      value: stats?.totalReports || 0,
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Platform İstatistikleri</h2>
        <p className="text-muted-foreground">
          Platformunuzun genel durumunu ve performansını görüntüleyin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardTab;
