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
      {/* PWA banners */}
      <OfflineBanner />

      <Navbar />

      <main className="flex-1 pb-16 md:pb-0">
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
