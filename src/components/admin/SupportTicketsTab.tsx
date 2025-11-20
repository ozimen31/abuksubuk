import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SupportTicketsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [newPriority, setNewPriority] = useState<string>("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;

      const userIds = [...new Set(ticketsData.map((t: any) => t.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData.map((p: any) => [p.user_id, p]));

      return ticketsData.map((ticket: any) => ({
        ...ticket,
        profile: profilesMap.get(ticket.user_id),
      }));
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-support-messages", selectedTicket?.id],
    enabled: !!selectedTicket?.id,
    queryFn: async () => {
      const { data: messagesData, error: messagesError } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", selectedTicket.id)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      const userIds = [...new Set(messagesData.map((m: any) => m.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData.map((p: any) => [p.user_id, p]));

      return messagesData.map((msg: any) => ({
        ...msg,
        profile: profilesMap.get(msg.user_id),
      }));
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id || !selectedTicket?.id) throw new Error("Geçersiz işlem");

      const { error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: selectedTicket.id,
          user_id: session.user.id,
          message: replyMessage,
          is_admin_reply: true,
        } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Yanıt gönderildi" });
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages"] });
      setReplyMessage("");
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ status, priority }: { status?: string; priority?: string }) => {
      if (!selectedTicket?.id) throw new Error("Talep seçilmedi");

      const updates: any = {};
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (status === "closed") {
        updates.closed_at = new Date().toISOString();
        updates.closed_by = session?.user?.id;
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updates)
        .eq("id", selectedTicket.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Talep güncellendi" });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      setNewStatus("");
      setNewPriority("");
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      open: { variant: "default", label: "Açık" },
      in_progress: { variant: "secondary", label: "İşlemde" },
      closed: { variant: "outline", label: "Kapalı" },
    };
    const config = variants[status] || variants.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      low: { variant: "outline", label: "Düşük" },
      normal: { variant: "secondary", label: "Normal" },
      high: { variant: "destructive", label: "Yüksek" },
    };
    const config = variants[priority] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Destek Talepleri</CardTitle>
          <CardDescription>Kullanıcıların destek taleplerini görüntüleyin ve yanıtlayın</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Konu</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.map((ticket: any) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.profile?.username || "Bilinmeyen"}</TableCell>
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>{new Date(ticket.created_at).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setNewStatus(ticket.status);
                        setNewPriority(ticket.priority);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Görüntüle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Destek Talebi: {selectedTicket?.subject}</span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Kullanıcı: {selectedTicket?.profile?.username || "Bilinmeyen"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Durum</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Açık</SelectItem>
                    <SelectItem value="in_progress">İşlemde</SelectItem>
                    <SelectItem value="closed">Kapalı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Öncelik</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => updateTicketMutation.mutate({ 
                status: newStatus !== selectedTicket?.status ? newStatus : undefined,
                priority: newPriority !== selectedTicket?.priority ? newPriority : undefined 
              })}
              disabled={updateTicketMutation.isPending || (newStatus === selectedTicket?.status && newPriority === selectedTicket?.priority)}
            >
              {updateTicketMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Güncelle"}
            </Button>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Mesajlar</h3>
              {messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${msg.is_admin_reply ? "bg-secondary" : "bg-muted"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-semibold">
                      {msg.is_admin_reply ? "Admin" : msg.profile?.username || "Kullanıcı"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-reply">Admin Yanıtı</Label>
              <Textarea
                id="admin-reply"
                placeholder="Yanıtınızı yazın"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
              />
              <Button
                onClick={() => sendReplyMutation.mutate()}
                disabled={!replyMessage || sendReplyMutation.isPending}
                className="w-full"
              >
                {sendReplyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yanıt Gönder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTicketsTab;
