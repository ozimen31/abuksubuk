import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Trash2, Plus, Edit, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SlidersTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    button_text: "",
    button_link: "",
    order_index: 0,
  });

  const { data: sliders, isLoading } = useQuery({
    queryKey: ["admin-sliders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slider_images")
        .select("*")
        .order("order_index");

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("slider_images").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Slider eklendi" });
      queryClient.invalidateQueries({ queryKey: ["admin-sliders"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("slider_images")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Slider güncellendi" });
      queryClient.invalidateQueries({ queryKey: ["admin-sliders"] });
      setIsDialogOpen(false);
      setEditingSlider(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("slider_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Slider silindi" });
      queryClient.invalidateQueries({ queryKey: ["admin-sliders"] });
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("slider_images")
        .update({ active: !active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Slider durumu güncellendi" });
      queryClient.invalidateQueries({ queryKey: ["admin-sliders"] });
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      button_text: "",
      button_link: "",
      order_index: 0,
    });
  };

  const handleEdit = (slider: any) => {
    setEditingSlider(slider);
    setFormData({
      title: slider.title,
      description: slider.description || "",
      image_url: slider.image_url,
      button_text: slider.button_text || "",
      button_link: slider.button_link || "",
      order_index: slider.order_index || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.image_url) {
      toast({
        title: "Hata",
        description: "Başlık ve görsel URL'i zorunludur",
        variant: "destructive",
      });
      return;
    }

    if (editingSlider) {
      updateMutation.mutate({ id: editingSlider.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
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
          <CardTitle>Slider Yönetimi</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setEditingSlider(null);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Slider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSlider ? "Slider Düzenle" : "Yeni Slider Ekle"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Başlık *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Slider başlığı"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Slider açıklaması..."
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">Görsel URL *</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="button_text">Buton Metni</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Detayları Gör"
                  />
                </div>
                <div>
                  <Label htmlFor="button_link">Buton Linki</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    placeholder="/listings"
                  />
                </div>
                <div>
                  <Label htmlFor="order">Sıra</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingSlider ? "Güncelle" : "Ekle"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingSlider(null);
                      resetForm();
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Görsel</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sliders && sliders.length > 0 ? (
                  sliders.map((slider) => (
                    <TableRow key={slider.id}>
                      <TableCell>
                        <img
                          src={slider.image_url}
                          alt={slider.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{slider.title}</TableCell>
                      <TableCell>{slider.order_index}</TableCell>
                      <TableCell>
                        <Badge variant={slider.active ? "default" : "secondary"}>
                          {slider.active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(slider)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={slider.active ? "secondary" : "default"}
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: slider.id,
                                active: slider.active,
                              })
                            }
                          >
                            {slider.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm("Bu slider'ı silmek istediğinizden emin misiniz?")) {
                                deleteMutation.mutate(slider.id);
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Henüz slider eklenmemiş
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

export default SlidersTab;
