import SEO from '@components/common/SEO/SEO';
import LocalBusinessSchema from '@components/common/StructuredData/LocalBusinessSchema';
import OrganizationSchema from '@components/common/StructuredData/OrganizationSchema';
import Hero from '@components/home/Hero/Hero';
import CoreValues from '@components/home/CoreValues/CoreValues';
import AboutSection from '@components/home/AboutSection/AboutSection';
import CampPhotos from '@components/home/CampPhotos/CampPhotos';

const Home = () => {
  return (
    <>
      <SEO pageKey="home" />
      <LocalBusinessSchema />
      <OrganizationSchema />
      <Hero />
      <CoreValues />
      <AboutSection />
      <CampPhotos />
    </>
  );
};

export default Home;
