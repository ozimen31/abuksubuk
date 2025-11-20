import Navbar from "@/components/Navbar";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import HeroSlider from "@/components/HeroSlider";
import CategoryQuickLinks from "@/components/CategoryQuickLinks";
import FeaturedListings from "@/components/FeaturedListings";
import TrustBadges from "@/components/TrustBadges";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBanner />
      <Navbar />
      
      {/* Hero Slider */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16">
        <div className="container mx-auto px-4">
          <HeroSlider />
        </div>
      </section>

      {/* Category Quick Links */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">
            <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
              Kategoriler
            </span>
          </h2>
          <CategoryQuickLinks />
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12">
        <TrustBadges />
      </section>

      {/* Featured Listings */}
      <section className="py-16 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-brand-blue via-primary to-brand-blue bg-clip-text text-transparent">
                Öne Çıkan İlanlar
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              En popüler ve güvenilir satıcılardan binlerce güvenli ilan
            </p>
          </div>
          <FeaturedListings />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
                Nasıl Çalışır?
              </span>
            </h2>
            <p className="text-muted-foreground">
              3 basit adımda güvenli alışveriş yapın
            </p>
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
