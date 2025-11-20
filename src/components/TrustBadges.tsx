import { Shield, Clock, CheckCircle, Headphones } from "lucide-react";

const badges = [
  {
    icon: Shield,
    title: "Shopier Güvencesi",
    description: "Güvenli ödeme sistemi",
  },
  {
    icon: CheckCircle,
    title: "Doğrulanmış Satıcı",
    description: "Onaylı hesaplar",
  },
  {
    icon: Clock,
    title: "Hızlı Teslimat",
    description: "Anında teslim",
  },
  {
    icon: Headphones,
    title: "7/24 Destek",
    description: "Canlı yardım",
  },
];

const TrustBadges = () => {
  return (
    <div className="py-8 border-y border-glass-border bg-dark-surface/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center gap-3 p-4 rounded-xl hover:bg-card/50 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;
