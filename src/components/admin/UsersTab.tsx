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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Shield, ShieldCheck, User, Wallet, Ban, Edit, AlertTriangle } from "lucide-react";

const UsersTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [balanceDialog, setBalanceDialog] = useState<{ open: boolean; userId: string; username: string } | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [banDialog, setBanDialog] = useState<{ open: boolean; userId: string; username: string; isBanned: boolean } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [ipBanDialog, setIpBanDialog] = useState<{ open: boolean; userId: string; username: string } | null>(null);
  const [ipAddress, setIpAddress] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .maybeSingle();

          return {
            ...profile,
            user_roles: roles || { role: "user" },
          };
        })
      );

      return usersWithRoles;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role } as any)
          .eq("user_id", userId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role } as any);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Kullanıcı rolü güncellendi" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", userId)
        .single();

      const newBalance = (profile?.balance || 0) + amount;

      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Bakiye yüklendi" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setBalanceDialog(null);
      setBalanceAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason, ban }: { userId: string; reason: string; ban: boolean }) => {
      if (ban) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error: banError } = await supabase
          .from("banned_users")
          .insert({
            user_id: userId,
            reason,
            banned_by: user?.id,
            is_active: true
          });
        
        if (banError) throw banError;
      } else {
        const { error: unbanError } = await supabase
          .from("banned_users")
          .update({ is_active: false })
          .eq("user_id", userId);
        
        if (unbanError) throw unbanError;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: ban })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ 
        title: "Başarılı", 
        description: variables.ban ? "Kullanıcı banlandı" : "Kullanıcı ban kaldırıldı" 
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setBanDialog(null);
      setBanReason("");
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const banIpMutation = useMutation({
    mutationFn: async ({ ipAddress, reason, userId }: { ipAddress: string; reason: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("banned_ips")
        .insert({
          ip_address: ipAddress,
          reason,
          banned_by: user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "IP adresi banlandı" });
      setIpBanDialog(null);
      setIpAddress("");
      setBanReason("");
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadge = (roles: any) => {
    if (!roles) {
      return <Badge variant="secondary"><User className="h-3 w-3 mr-1" />Kullanıcı</Badge>;
    }
    
    const role = roles.role;
    
    if (role === "admin") {
      return <Badge variant="destructive"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    if (role === "moderator") {
      return <Badge variant="default"><ShieldCheck className="h-3 w-3 mr-1" />Moderatör</Badge>;
    }
    return <Badge variant="secondary"><User className="h-3 w-3 mr-1" />Kullanıcı</Badge>;
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
          <CardTitle>Kullanıcı Yönetimi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı adı veya telefon ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı Adı</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead>Satışlar</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username || "Anonim"}
                      </TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user.user_roles)}</TableCell>
                      <TableCell>
                        {user.is_banned ? (
                          <Badge variant="destructive">Banlı</Badge>
                        ) : user.verified ? (
                          <Badge variant="default">Doğrulanmış</Badge>
                        ) : (
                          <Badge variant="secondary">Doğrulanmamış</Badge>
                        )}
                      </TableCell>
                      <TableCell>₺{user.balance?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>{user.total_sales || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.user_roles?.role || "user"}
                            onValueChange={(value: "admin" | "moderator" | "user") =>
                              updateRoleMutation.mutate({
                                userId: user.user_id,
                                role: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Kullanıcı</SelectItem>
                              <SelectItem value="moderator">Moderatör</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBalanceDialog({ open: true, userId: user.user_id, username: user.username || "" })}
                          >
                            <Wallet className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_banned ? "default" : "destructive"}
                            onClick={() => setBanDialog({ 
                              open: true, 
                              userId: user.user_id, 
                              username: user.username || "",
                              isBanned: user.is_banned || false
                            })}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIpBanDialog({ open: true, userId: user.user_id, username: user.username || "" })}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={balanceDialog?.open || false} onOpenChange={(open) => !open && setBalanceDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bakiye Yükle</DialogTitle>
            <DialogDescription>
              {balanceDialog?.username} kullanıcısına bakiye ekle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Tutar (₺)</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(null)}>İptal</Button>
            <Button 
              onClick={() => {
                const amount = parseFloat(balanceAmount);
                if (amount > 0 && balanceDialog) {
                  addBalanceMutation.mutate({ userId: balanceDialog.userId, amount });
                }
              }}
              disabled={!balanceAmount || parseFloat(balanceAmount) <= 0}
            >
              Yükle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={banDialog?.open || false} onOpenChange={(open) => !open && setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{banDialog?.isBanned ? "Banı Kaldır" : "Kullanıcıyı Banla"}</DialogTitle>
            <DialogDescription>
              {banDialog?.username} {banDialog?.isBanned ? "için ban kaldırılacak" : "banlanacak"}
            </DialogDescription>
          </DialogHeader>
          {!banDialog?.isBanned && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ban-reason">Ban Nedeni</Label>
                <Textarea
                  id="ban-reason"
                  placeholder="Ban nedenini açıklayın..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>İptal</Button>
            <Button 
              variant={banDialog?.isBanned ? "default" : "destructive"}
              onClick={() => {
                if (banDialog) {
                  banUserMutation.mutate({ 
                    userId: banDialog.userId, 
                    reason: banReason,
                    ban: !banDialog.isBanned
                  });
                }
              }}
            >
              {banDialog?.isBanned ? "Banı Kaldır" : "Banla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ipBanDialog?.open || false} onOpenChange={(open) => !open && setIpBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>IP Adresi Banla</DialogTitle>
            <DialogDescription>
              {ipBanDialog?.username} kullanıcısının IP adresini banla
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip-address">IP Adresi</Label>
              <Input
                id="ip-address"
                placeholder="192.168.1.1"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-ban-reason">Ban Nedeni</Label>
              <Textarea
                id="ip-ban-reason"
                placeholder="IP ban nedenini açıklayın..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIpBanDialog(null)}>İptal</Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (ipBanDialog && ipAddress) {
                  banIpMutation.mutate({ 
                    userId: ipBanDialog.userId,
                    ipAddress,
                    reason: banReason
                  });
                }
              }}
              disabled={!ipAddress}
            >
              IP Banla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTab;
