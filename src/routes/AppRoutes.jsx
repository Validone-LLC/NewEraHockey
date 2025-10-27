import { Routes, Route } from 'react-router-dom';
import Header from '@components/common/Header/Header';
import Footer from '@components/common/Footer/Footer';
import SkipLink from '@components/common/SkipLink/SkipLink';
import Home from '@pages/Home';
import CoachTeam from '@pages/CoachTeam';
import Testimonials from '@pages/Testimonials';
import SubmitReview from '@pages/SubmitReview';
import Gallery from '@pages/Gallery';
import Contact from '@pages/Contact';
import FAQ from '@pages/FAQ';
import EventRegistration from '@pages/EventRegistration';
import RegistrationSuccess from '@pages/RegistrationSuccess';
import RegistrationCancel from '@pages/RegistrationCancel';
import TrainingSchedule from '@pages/TrainingSchedule';
import TermsAndConditions from '@pages/TermsAndConditions';
import PrivacyPolicy from '@pages/PrivacyPolicy';
import Waiver from '@pages/Waiver';
import NotFound from '@pages/NotFound';

const AppRoutes = () => {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" className="flex-grow pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coaches" element={<CoachTeam />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/testimonials/submit-review" element={<SubmitReview />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/event-registration" element={<TrainingSchedule />} />
          <Route path="/register/:eventId" element={<EventRegistration />} />
          <Route path="/register/success" element={<RegistrationSuccess />} />
          <Route path="/register/cancel" element={<RegistrationCancel />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/waiver" element={<Waiver />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default AppRoutes;
