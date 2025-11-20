import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SettingsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({
        title: "Başarılı",
        description: "Ayar güncellendi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ayar güncellenirken bir hata oluştu",
        variant: "destructive",
      });
      console.error('Error updating setting:', error);
    },
  });

  const shopierEnabled = settings?.find(s => s.key === 'shopier_enabled')?.value === 'true';

  const handleShopierToggle = (checked: boolean) => {
    updateSettingMutation.mutate({
      key: 'shopier_enabled',
      value: checked ? 'true' : 'false',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ödeme Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shopier-toggle">Shopier ile Bakiye Yükleme</Label>
                <p className="text-sm text-muted-foreground">
                  Kullanıcıların Shopier ile bakiye yüklemesine izin ver
                </p>
              </div>
              <Switch
                id="shopier-toggle"
                checked={shopierEnabled}
                onCheckedChange={handleShopierToggle}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
