import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Target, Sword, Crosshair, Users, Trophy, Package } from "lucide-react";

const iconMap: Record<string, any> = {
  Gamepad2,
  Target,
  Sword,
  Crosshair,
  Users,
  Trophy,
  Package,
};

const CategoryQuickLinks = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("order_index");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
      {categories?.map((category) => {
        const Icon = iconMap[category.icon || ''] || iconMap.Package;
        return (
          <button
            key={category.id}
            className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-card hover:bg-card/80 border border-glass-border hover:border-brand-blue/50 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center group-hover:bg-brand-blue/20 transition-all">
              <Icon className="w-6 h-6 text-brand-blue" />
            </div>
            <span className="text-xs font-medium text-center line-clamp-2">
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryQuickLinks;
