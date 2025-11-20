import { Facebook, Twitter, Instagram, Mail, Package } from "lucide-react";
const Footer = () => {
  return <footer className="border-t border-glass-border bg-brand-navy">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue to-primary flex items-center justify-center shadow-glow-blue">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-brand-blue to-primary bg-clip-text text-transparent">
                Hesap Market   
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Güvenli oyun hesabı ve dijital içerik alım satım platformu
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-card hover:bg-brand-blue/20 flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-card hover:bg-brand-blue/20 flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-card hover:bg-brand-blue/20 flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Hızlı Erişim</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-brand-blue transition-colors">Anasayfa</a></li>
              <li><a href="#" className="hover:text-brand-blue transition-colors">İlanlar</a></li>
              <li><a href="#" className="hover:text-brand-blue transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-brand-blue transition-colors">İletişim</a></li>
              <li><a href="#" className="hover:text-brand-blue transition-colors">SSS</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Yasal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-brand-blue transition-colors">Kullanım Şartları</a></li>
              <li><a href="#" className="hover:text-brand-blue transition-colors">Gizlilik Politikası</a></li>
              <li><a href="#" className="hover:text-brand-blue transition-colors">Çerez Politikası</a></li>
              <li><a href="#" className="hover:text-brand-blue transition-colors">KVKK</a></li>
              <li><a href="#" className="hover:text-brand-blue transition-colors">İptal & İade</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Destek</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-blue" />
                <span>hesapmarket.tr@gmail.com</span>
              </li>
              <li>7/24 Canlı Destek</li>
              <li className="mt-4 p-4 rounded-lg bg-card/50 border border-glass-border hover:border-brand-blue/50 transition-colors">
                <p className="font-semibold text-foreground mb-1">Satıcı mısınız?</p>
                <p className="text-xs mb-2">Hemen ilanınızı oluşturun ve satışa başlayın!</p>
                <a href="/auth" className="text-brand-blue hover:underline text-xs font-medium">
                  Ücretsiz Kayıt Ol →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-glass-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 Hesap Market. Tüm hakları saklıdır.</p>
            <p className="text-xs">
              Bu platform oyun hesapları ve dijital içerikler için güvenli bir pazar yeridir.
            </p>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;