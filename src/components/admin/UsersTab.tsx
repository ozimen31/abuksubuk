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
import { Search, Shield, ShieldCheck, User } from "lucide-react";

const UsersTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // First get profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Then get roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .single();

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
      // First check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role } as any)
          .eq("user_id", userId);
        
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role } as any);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kullanıcı rolü güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
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
                  <TableHead>Bakiye</TableHead>
                  <TableHead>Satış Puanı</TableHead>
                  <TableHead>Toplam Satış</TableHead>
                  <TableHead>Rol</TableHead>
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
                      <TableCell>{user.balance?.toFixed(2)} ₺</TableCell>
                      <TableCell>{user.seller_score?.toFixed(1) || 0}</TableCell>
                      <TableCell>{user.total_sales || 0}</TableCell>
                      <TableCell>{getRoleBadge(user.user_roles)}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.user_roles?.role || "user"}
                          onValueChange={(value: "admin" | "moderator" | "user") =>
                            updateRoleMutation.mutate({
                              userId: user.user_id,
                              role: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Kullanıcı</SelectItem>
                            <SelectItem value="moderator">Moderatör</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
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
    </div>
  );
};

export default UsersTab;
