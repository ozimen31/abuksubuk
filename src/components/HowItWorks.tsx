import { ShoppingCart, Shield, MessageSquare, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: ShoppingCart,
    title: "İlan Bul veya Oluştur",
    description: "Binlerce ilan arasından aradığınızı bulun veya kendi ilanınızı oluşturun",
  },
  {
    icon: Shield,
    title: "Güvenli Ödeme",
    description: "Shopier ile güvenli ödeme yapın. Paranız escrow sisteminde korunur",
  },
  {
    icon: MessageSquare,
    title: "Satıcı ile İletişim",
    description: "Mesajlaşma sistemi ile satıcı ve alıcı güvenle iletişim kurar",
  },
  {
    icon: Wallet,
    title: "Teslim Al veya Sat",
    description: "Ürün teslim edildikten sonra bakiyenize aktarılır veya ürününüzü alırsınız",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-dark-surface/50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
              Nasıl Çalışır?
            </span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Sadece 4 adımda güvenli alışverişe başlayın
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="relative p-6 border-glass-border bg-card/80 backdrop-blur-sm hover:bg-card hover:shadow-lg transition-all"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-primary flex items-center justify-center font-bold text-xl shadow-glow-blue">
                  {index + 1}
                </div>
                <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-4 mx-auto mt-4">
                  <Icon className="w-8 h-8 text-brand-blue" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">{step.title}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {step.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
