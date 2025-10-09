import Hero from '@components/home/Hero/Hero';
import CoreValues from '@components/home/CoreValues/CoreValues';
import AboutSection from '@components/home/AboutSection/AboutSection';
import CampPhotos from '@components/home/CampPhotos/CampPhotos';

const Home = () => {
  return (
    <>
      <Hero />
      <CoreValues />
      <AboutSection />
      <CampPhotos />
    </>
  );
};

export default Home;
