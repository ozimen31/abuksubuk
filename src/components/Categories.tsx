import { Gamepad2, Target, Sword, Crosshair, Users, Trophy, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";

const categories = [
  {
    icon: Gamepad2,
    title: "Steam",
    description: "Steam hesapları ve oyunlar",
  },
  {
    icon: Target,
    title: "Valorant",
    description: "Valorant hesapları ve VP",
  },
  {
    icon: Sword,
    title: "League of Legends",
    description: "LoL hesapları ve RP",
  },
  {
    icon: Crosshair,
    title: "CS:GO",
    description: "CS:GO hesapları ve itemler",
  },
  {
    icon: Users,
    title: "PUBG",
    description: "PUBG Mobile ve PC",
  },
  {
    icon: Trophy,
    title: "FIFA",
    description: "FIFA hesapları ve coin",
  },
  {
    icon: Coins,
    title: "Oyun İçi Eşyalar",
    description: "Tüm oyunlar için itemler",
  },
];

const Categories = () => {
  return (
    <section id="categories" className="py-20 px-4 bg-dark-surface/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
              Popüler Kategoriler
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            İhtiyacınız olan her şey burada
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-glass-border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-brand-blue/50 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="p-4 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center group-hover:bg-brand-blue/20 transition-all mx-auto">
                    <Icon className="w-6 h-6 text-brand-blue" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold mb-1 text-foreground">
                      {category.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
