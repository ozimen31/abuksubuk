import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const OrdersTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          listings (title),
          profiles!orders_buyer_id_fkey (username)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status } as any)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Sipariş durumu güncellendi" });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    return statusFilter === "all" || order.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      paid: "default",
      delivered: "outline",
      completed: "default",
      disputed: "destructive",
      cancelled: "secondary",
    };

    const labels: Record<string, string> = {
      pending: "Beklemede",
      paid: "Ödendi",
      delivered: "Teslim Edildi",
      completed: "Tamamlandı",
      disputed: "İtiraz Var",
      cancelled: "İptal",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sipariş Yönetimi</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="paid">Ödendi</SelectItem>
              <SelectItem value="delivered">Teslim Edildi</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="disputed">İtiraz Var</SelectItem>
              <SelectItem value="cancelled">İptal</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İlan</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Komisyon</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {order.listings?.title || "İlan silinmiş"}
                      </TableCell>
                      <TableCell>{order.profiles?.username || "Anonim"}</TableCell>
                      <TableCell>{order.price} ₺</TableCell>
                      <TableCell>{order.commission} ₺</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({ id: order.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Beklemede</SelectItem>
                            <SelectItem value="paid">Ödendi</SelectItem>
                            <SelectItem value="delivered">Teslim Edildi</SelectItem>
                            <SelectItem value="completed">Tamamlandı</SelectItem>
                            <SelectItem value="disputed">İtiraz</SelectItem>
                            <SelectItem value="cancelled">İptal</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Sipariş bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersTab;
