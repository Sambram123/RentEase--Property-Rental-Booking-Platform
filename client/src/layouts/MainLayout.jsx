import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import OfflineBanner from '../components/OfflineBanner';
import InstallPrompt from '../components/InstallPrompt';
import UpdateBanner from '../components/UpdateBanner';
import PageTransition from '../components/PageTransition';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip to main content — visible on keyboard focus for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* PWA banners */}
      <OfflineBanner />

      <Navbar />

      <main id="main-content" className="flex-1 pb-16 md:pb-0">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <Footer />

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* PWA prompts */}
      <InstallPrompt />
      <UpdateBanner />
    </div>
  );
};

export default MainLayout;

