import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CategoryQuickLinks = () => {
  const navigate = useNavigate();

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

  const handleCategoryClick = (slug: string) => {
    navigate(`/listings?category=${slug}`);
  };

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
      {categories?.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.slug)}
          className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-card hover:bg-card/80 border border-glass-border hover:border-brand-blue/50 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center group-hover:bg-brand-blue/20 transition-all overflow-hidden">
            {category.icon && category.icon.startsWith('http') ? (
              <img 
                src={category.icon} 
                alt={category.name}
                className="w-7 h-7 object-contain"
              />
            ) : (
              <Package className="w-6 h-6 text-brand-blue" />
            )}
          </div>
          <span className="text-xs font-medium text-center line-clamp-2">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryQuickLinks;
