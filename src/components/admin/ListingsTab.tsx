import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ListingsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories (name),
          profiles!listings_user_id_fkey (username)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("listings")
        .update({ status } as any)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "İlan durumu güncellendi" });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "İlan silindi" });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const filteredListings = listings?.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      draft: "secondary",
      sold: "outline",
      paused: "secondary",
      rejected: "destructive",
    };

    const labels: Record<string, string> = {
      active: "Aktif",
      draft: "Taslak",
      sold: "Satıldı",
      paused: "Duraklatıldı",
      rejected: "Reddedildi",
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
        <CardHeader>
          <CardTitle>İlan Yönetimi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İlan ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="sold">Satıldı</SelectItem>
                <SelectItem value="paused">Duraklatıldı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Satıcı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Görüntülenme</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings && filteredListings.length > 0 ? (
                  filteredListings.map((listing: any) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {listing.title}
                      </TableCell>
                      <TableCell>{listing.profiles?.username || "Anonim"}</TableCell>
                      <TableCell>{listing.categories?.name || "-"}</TableCell>
                      <TableCell>{listing.price} ₺</TableCell>
                      <TableCell>{getStatusBadge(listing.status)}</TableCell>
                      <TableCell>{listing.view_count || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/listing/${listing.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select
                            value={listing.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({ id: listing.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Aktif</SelectItem>
                              <SelectItem value="draft">Taslak</SelectItem>
                              <SelectItem value="sold">Satıldı</SelectItem>
                              <SelectItem value="paused">Duraklat</SelectItem>
                              <SelectItem value="rejected">Reddet</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm("Bu ilanı silmek istediğinizden emin misiniz?")) {
                                deleteMutation.mutate(listing.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      İlan bulunamadı
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

export default ListingsTab;
