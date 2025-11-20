import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Support = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", session!.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["support-messages", selectedTicketId],
    enabled: !!selectedTicketId,
    queryFn: async () => {
      const { data: messagesData, error: messagesError } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", selectedTicketId!)
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

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("Oturum bulunamadı");

      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: session.user.id,
          subject,
          priority,
          status: "open",
        } as any)
        .select()
        .single();

      if (ticketError) throw ticketError;

      const { error: messageError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticket.id,
          user_id: session.user.id,
          message,
          is_admin_reply: false,
        } as any);

      if (messageError) throw messageError;
    },
    onSuccess: () => {
      toast({ title: "Destek talebi oluşturuldu", description: "Talebiniz en kısa sürede değerlendirilecektir" });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setIsCreateDialogOpen(false);
      setSubject("");
      setMessage("");
      setPriority("normal");
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id || !selectedTicketId) throw new Error("Geçersiz işlem");

      const { error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: selectedTicketId,
          user_id: session.user.id,
          message: replyMessage,
          is_admin_reply: false,
        } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Mesaj gönderildi" });
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
      setReplyMessage("");
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

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Destek sistemine erişmek için giriş yapmalısınız</h1>
          <Button onClick={() => window.location.href = "/auth"}>Giriş Yap</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
                Destek Talepleri
              </span>
            </h1>
            <p className="text-muted-foreground">Tüm destek taleplerinizi buradan yönetebilirsiniz</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Talep
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Destek Talebi</DialogTitle>
                <DialogDescription>Sorununuzu detaylı bir şekilde açıklayın</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Konu</Label>
                  <Input
                    id="subject"
                    placeholder="Talep konusu"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Öncelik</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
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
                <div>
                  <Label htmlFor="message">Mesaj</Label>
                  <Textarea
                    id="message"
                    placeholder="Sorununuzu detaylı olarak açıklayın"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button
                  onClick={() => createTicketMutation.mutate()}
                  disabled={!subject || !message || createTicketMutation.isPending}
                  className="w-full"
                >
                  {createTicketMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Talep Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {tickets?.map((ticket: any) => (
              <Card key={ticket.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTicketId(ticket.id)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{ticket.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(ticket.created_at).toLocaleDateString("tr-TR")}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Destek Talebi Detayları</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="reply">Yanıt</Label>
                <Textarea
                  id="reply"
                  placeholder="Yanıtınızı yazın"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={() => sendReplyMutation.mutate()}
                  disabled={!replyMessage || sendReplyMutation.isPending}
                  className="w-full"
                >
                  {sendReplyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gönder"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
};

export default Support;
