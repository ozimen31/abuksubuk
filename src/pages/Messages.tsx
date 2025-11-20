import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_sales: number | null;
  role: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  body: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  read: boolean;
}

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Fetch conversations list
  const { data: conversations } = useQuery({
    queryKey: ["conversations", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const userId = session!.user.id;
      
      // Get all messages where user is involved
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs from messages
      const userIds = new Set<string>();
      messages?.forEach((msg: any) => {
        userIds.add(msg.from_user_id);
        userIds.add(msg.to_user_id);
      });

      // Fetch all user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, total_sales")
        .in("user_id", Array.from(userIds));

      // Fetch user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]));

      // Group by conversation partner
      const conversationMap = new Map<string, Conversation>();
      
      messages?.forEach((msg: any) => {
        const partnerId = msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id;
        const partnerProfile = profileMap.get(partnerId);
        const partnerRole = roleMap.get(partnerId);
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            user_id: partnerId,
            username: partnerProfile?.username || "Kullanıcı",
            avatar_url: partnerProfile?.avatar_url,
            total_sales: partnerProfile?.total_sales,
            role: partnerRole || null,
            last_message: msg.body,
            last_message_time: msg.created_at,
            unread_count: 0,
          });
        }
        
        // Count unread messages
        if (msg.to_user_id === userId && !msg.read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unread_count++;
        }
      });
      
      return Array.from(conversationMap.values());
    },
  });

  // Handle URL parameter for starting a new conversation
  useEffect(() => {
    const userParam = searchParams.get('user');
    if (userParam && !selectedConversation) {
      setSelectedConversation(userParam);
    }
  }, [searchParams, selectedConversation]);

  // Fetch messages for selected conversation
  const { data: messages } = useQuery({
    queryKey: ["messages", selectedConversation, session?.user?.id],
    enabled: !!selectedConversation && !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(from_user_id.eq.${session!.user.id},to_user_id.eq.${selectedConversation}),` +
          `and(from_user_id.eq.${selectedConversation},to_user_id.eq.${session!.user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("to_user_id", session!.user.id)
        .eq("from_user_id", selectedConversation);

      return data as Message[];
    },
  });

  // Fetch selected conversation partner's profile
  const { data: selectedUserProfile } = useQuery({
    queryKey: ["userProfile", selectedConversation],
    enabled: !!selectedConversation,
    queryFn: async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url, total_sales")
        .eq("user_id", selectedConversation)
        .maybeSingle();
      
      if (profileError) throw profileError;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", selectedConversation)
        .maybeSingle();
      
      return { ...profileData, role: roleData?.role };
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from("messages")
        .insert({
          from_user_id: session!.user.id,
          to_user_id: selectedConversation!,
          body,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi",
        variant: "destructive",
      });
    },
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `to_user_id=eq.${session.user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, queryClient]);

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const selectedConversationData = conversations?.find(
    (c) => c.user_id === selectedConversation
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
            Mesajlar
          </span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="border-glass-border bg-card/50 backdrop-blur-sm">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {conversations?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Henüz mesajınız yok</p>
                  </div>
                ) : (
                  conversations?.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedConversation(conv.user_id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConversation === conv.user_id
                          ? "bg-brand-blue/20 border border-brand-blue/30"
                          : "bg-dark-surface hover:bg-dark-surface/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={conv.avatar_url || undefined} />
                          <AvatarFallback className="bg-brand-blue/10">
                            <User className="w-4 h-4 text-brand-blue" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <p className="font-medium truncate">
                                {conv.username}
                              </p>
                              {conv.role === 'admin' && (
                                <img 
                                  src="https://cdn.itemsatis.com/uploads/medals/60760ea5cd37a-medals-2644af7bc00efe5566a2154da9c32c4fc8f643fa.png" 
                                  alt="Admin Rozeti" 
                                  className="w-4 h-4 flex-shrink-0"
                                  title="Admin"
                                />
                              )}
                              {(conv.total_sales ?? 0) > 0 && (
                                <img 
                                  src="https://cdn.itemsatis.com/uploads/medals/alimmagaza.png" 
                                  alt="İlk Satış Rozeti" 
                                  className="w-4 h-4 flex-shrink-0"
                                  title="İlk satışını yaptı!"
                                />
                              )}
                            </div>
                            {conv.unread_count > 0 && (
                              <span className="bg-brand-blue text-white text-xs px-2 py-0.5 rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Messages Area */}
          <Card className="md:col-span-2 border-glass-border bg-card/50 backdrop-blur-sm flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-glass-border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConversationData?.avatar_url || selectedUserProfile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-brand-blue/10">
                        <User className="w-4 h-4 text-brand-blue" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {selectedConversationData?.username || selectedUserProfile?.username || "Kullanıcı"}
                        </p>
                        {(selectedConversationData?.role === 'admin' || selectedUserProfile?.role === 'admin') && (
                          <img 
                            src="https://cdn.itemsatis.com/uploads/medals/60760ea5cd37a-medals-2644af7bc00efe5566a2154da9c32c4fc8f643fa.png" 
                            alt="Admin Rozeti" 
                            className="w-5 h-5"
                            title="Admin"
                          />
                        )}
                        {((selectedConversationData?.total_sales ?? selectedUserProfile?.total_sales ?? 0) > 0) && (
                          <img 
                            src="https://cdn.itemsatis.com/uploads/medals/alimmagaza.png" 
                            alt="İlk Satış Rozeti" 
                            className="w-5 h-5"
                            title="İlk satışını yaptı!"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.from_user_id === session?.user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.from_user_id === session?.user?.id
                              ? "bg-brand-blue text-white"
                              : "bg-dark-surface"
                          }`}
                        >
                          <p className="text-sm">{msg.body}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.from_user_id === session?.user?.id
                                ? "text-white/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-glass-border">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Mesajınızı yazın..."
                      className="bg-dark-surface border-glass-border"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-brand-blue hover:bg-brand-blue/90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Bir konuşma seçin</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Messages;
