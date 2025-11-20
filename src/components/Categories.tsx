import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";

const Categories = () => {
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("order_index");
      return data;
    },
  });

  const handleCategoryClick = (slug: string) => {
    navigate(`/listings?category=${slug}`);
  };

  return (
    <section id="categories" className="py-12 px-4 bg-dark-surface/30">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
              Popüler Kategoriler
            </span>
          </h2>
          <p className="text-muted-foreground">
            İhtiyacınız olan her şey burada
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {categories?.map((category) => (
            <Card
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className="group relative overflow-hidden border-glass-border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-brand-blue/50 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="p-3 space-y-2">
                <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center group-hover:bg-brand-blue/20 transition-all mx-auto overflow-hidden">
                  {category.icon && category.icon.startsWith('http') ? (
                    <img 
                      src={category.icon} 
                      alt={category.name}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-brand-blue" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-xs font-bold mb-0.5 text-foreground line-clamp-1">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
