import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Users, FolderTree, Package, ShoppingCart, Images, Key, Wallet, Flag, Settings, HelpCircle, ShieldCheck } from "lucide-react";
import DashboardTab from "@/components/admin/DashboardTab";
import UsersTab from "@/components/admin/UsersTab";
import CategoriesTab from "@/components/admin/CategoriesTab";
import ListingsTab from "@/components/admin/ListingsTab";
import OrdersTab from "@/components/admin/OrdersTab";
import SlidersTab from "@/components/admin/SlidersTab";
import BalanceKeysTab from "@/components/admin/BalanceKeysTab";
import WithdrawalsTab from "@/components/admin/WithdrawalsTab";
import ReportsTab from "@/components/admin/ReportsTab";
import SettingsTab from "@/components/admin/SettingsTab";
import SupportTicketsTab from "@/components/admin/SupportTicketsTab";
import VerificationTab from "@/components/admin/VerificationTab";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ["userRole", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session!.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  useEffect(() => {
    if (!sessionLoading && !roleLoading) {
      if (!session) {
        toast({ title: "Yetkilendirme Gerekli", description: "Admin paneline erişmek için giriş yapmalısınız", variant: "destructive" });
        navigate("/auth");
      } else if (!userRole) {
        toast({ title: "Yetkisiz Erişim", description: "Bu sayfaya erişim yetkiniz bulunmamaktadır", variant: "destructive" });
        navigate("/");
      } else {
        setIsAdmin(true);
      }
    }
  }, [session, userRole, sessionLoading, roleLoading, navigate, toast]);

  if (sessionLoading || roleLoading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2"><span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">Admin Paneli</span></h1>
          <p className="text-muted-foreground">Tüm platform yönetim işlemlerini buradan gerçekleştirebilirsiniz</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 lg:grid-cols-11 gap-2 h-auto bg-muted/50 p-2">
            <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 py-3"><LayoutDashboard className="h-4 w-4" /><span className="text-xs">Panel</span></TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col items-center gap-1 py-3"><Users className="h-4 w-4" /><span className="text-xs">Kullanıcılar</span></TabsTrigger>
            <TabsTrigger value="categories" className="flex flex-col items-center gap-1 py-3"><FolderTree className="h-4 w-4" /><span className="text-xs">Kategoriler</span></TabsTrigger>
            <TabsTrigger value="verification" className="flex flex-col items-center gap-1 py-3"><ShieldCheck className="h-4 w-4" /><span className="text-xs">Doğrulama</span></TabsTrigger>
            <TabsTrigger value="listings" className="flex flex-col items-center gap-1 py-3"><Package className="h-4 w-4" /><span className="text-xs">İlanlar</span></TabsTrigger>
            <TabsTrigger value="orders" className="flex flex-col items-center gap-1 py-3"><ShoppingCart className="h-4 w-4" /><span className="text-xs">Siparişler</span></TabsTrigger>
            <TabsTrigger value="sliders" className="flex flex-col items-center gap-1 py-3"><Images className="h-4 w-4" /><span className="text-xs">Slider</span></TabsTrigger>
            <TabsTrigger value="balance-keys" className="flex flex-col items-center gap-1 py-3"><Key className="h-4 w-4" /><span className="text-xs">Bakiye Key</span></TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex flex-col items-center gap-1 py-3"><Wallet className="h-4 w-4" /><span className="text-xs">Çekim</span></TabsTrigger>
            <TabsTrigger value="reports" className="flex flex-col items-center gap-1 py-3"><Flag className="h-4 w-4" /><span className="text-xs">Raporlar</span></TabsTrigger>
            <TabsTrigger value="support" className="flex flex-col items-center gap-1 py-3"><HelpCircle className="h-4 w-4" /><span className="text-xs">Destek</span></TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col items-center gap-1 py-3"><Settings className="h-4 w-4" /><span className="text-xs">Ayarlar</span></TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="verification"><VerificationTab /></TabsContent>
          <TabsContent value="listings"><ListingsTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="sliders"><SlidersTab /></TabsContent>
          <TabsContent value="balance-keys"><BalanceKeysTab /></TabsContent>
          <TabsContent value="withdrawals"><WithdrawalsTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
          <TabsContent value="support"><SupportTicketsTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPanel;
