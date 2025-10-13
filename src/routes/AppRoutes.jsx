import { Routes, Route } from 'react-router-dom';
import Header from '@components/common/Header/Header';
import Footer from '@components/common/Footer/Footer';
import SkipLink from '@components/common/SkipLink/SkipLink';
import Home from '@pages/Home';
import CoachTeam from '@pages/CoachTeam';
import Testimonials from '@pages/Testimonials';
import Gallery from '@pages/Gallery';
import Contact from '@pages/Contact';
import FAQ from '@pages/FAQ';
import EventRegistration from '@pages/EventRegistration';
import TermsAndConditions from '@pages/TermsAndConditions';
import PrivacyPolicy from '@pages/PrivacyPolicy';
import NotFound from '@pages/NotFound';

const AppRoutes = () => {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" className="flex-grow pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coach-team" element={<CoachTeam />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/register" element={<EventRegistration />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default AppRoutes;
