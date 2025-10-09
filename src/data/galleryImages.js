// Gallery categories
export const galleryCategories = [
  {
    id: 1,
    title: 'Training Camps',
    description: 'High-intensity training camps across the DMV area'
  },
  {
    id: 2,
    title: 'Inside Look at Lessons and Camps',
    description: 'Behind the scenes of our coaching sessions'
  },
  {
    id: 3,
    title: 'Trained Players',
    description: 'Players who have elevated their game with New Era Hockey'
  }
];

// Import all gallery JSON files
import kuzy from './gallery/kuzy.json';
import ashton from './gallery/ashton.json';
import ovechkin from './gallery/ovechkin.json';
import matt from './gallery/matt.json';
import domenic from './gallery/domenic.json';
import pacioretty from './gallery/pacioretty.json';
import future from './gallery/future.json';
import sully from './gallery/sully.json';
import wheatonCamp from './gallery/wheaton-camp-2023.json';
import restonCamp from './gallery/reston-camp-2023.json';
import coaches from './gallery/coaches.json';
import dmvTryout from './gallery/dmv-2024-tryout.json';
import camp1 from './gallery/camp-1.json';
import camp2 from './gallery/camp-2.json';
import camp3 from './gallery/camp-3.json';
import camp4 from './gallery/camp-4.json';
import camp5 from './gallery/camp-5.json';
import camp6 from './gallery/camp-6.json';
import camp7 from './gallery/camp-7.json';

// Combine all gallery images
export const galleryImages = [
  kuzy,
  ashton,
  ovechkin,
  matt,
  domenic,
  pacioretty,
  future,
  sully,
  wheatonCamp,
  restonCamp,
  coaches,
  dmvTryout,
  camp1,
  camp2,
  camp3,
  camp4,
  camp5,
  camp6,
  camp7
];

// Import all camp photos JSON files
import campPhoto1 from './camp-photos/camp-photo-1.json';
import campPhoto2 from './camp-photos/camp-photo-2.json';
import campPhoto3 from './camp-photos/camp-photo-3.json';
import campPhoto4 from './camp-photos/camp-photo-4.json';
import campPhoto5 from './camp-photos/camp-photo-5.json';
import campPhoto6 from './camp-photos/camp-photo-6.json';
import campPhoto7 from './camp-photos/camp-photo-7.json';
import campPhoto8 from './camp-photos/camp-photo-8.json';
import campPhoto9 from './camp-photos/camp-photo-9.json';
import campPhoto10 from './camp-photos/camp-photo-10.json';
import campPhoto11 from './camp-photos/camp-photo-11.json';

// Camp photos for home page carousel - sorted by order field
export const campPhotos = [
  campPhoto1,
  campPhoto2,
  campPhoto3,
  campPhoto4,
  campPhoto5,
  campPhoto6,
  campPhoto7,
  campPhoto8,
  campPhoto9,
  campPhoto10,
  campPhoto11
].sort((a, b) => a.order - b.order).map(photo => photo.src);
