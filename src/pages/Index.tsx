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
      
      {/* SEO H1 - Hidden but accessible to search engines */}
      <h1 className="sr-only">Hesap Market - Türkiye'nin En Güvenilir Oyun Hesabı Alım Satım Platformu</h1>
      
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
          <FeaturedListings />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <HowItWorks />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
