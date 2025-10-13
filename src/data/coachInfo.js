export const coaches = [
  {
    id: 'will-pasko',
    name: 'Coach Will Pasko',
    title: 'Head Coach & Founder',
    image: '/assets/images/coaches/PHOTO-2025-10-12-14-41-32.webp',
    quickSummary:
      'First-generation hockey player and coach with over two decades of expertise in power skating, in-game awareness, and hockey fundamentals. Passionate about developing athletes and uplifting the hockey community.',
    bio: {
      intro:
        'Meet Coach Will, a native of Virginia, who not only is a first-generation hockey player and coach with parents from Ukraine and Russia, but also an ardent advocate of the sport. Having taken to the ice at the young age of two, and later playing at the Junior level, his profound love for hockey was instilled by his father, an enduring influence who ignited his passion for the sport and his desire to uplift the hockey community!',
      experience:
        'Boasting over two decades of expertise in fundamental power skating techniques, in-game awareness both with and without the puck, and all requisite skills for hockey, Coach Will has left a lasting impact. His coaching has benefited an array of hockey players in the DMV area, pro athletes competing abroad, and prep school athletes nationwide.',
    },
    statement:
      "My vision for New Era Hockey is deeply rooted in my passion for the ever-evolving sport of hockey. Reflecting on the milestones of the game, we've seen the 'Miracle on Ice' in the '70s, the transformation of the game in the '80s and '90s with legends like Wayne Gretzky and Mario Lemieux, and the dawn of a new age of hockey with the advent of the 21st century. This new era embodies the sheer speed of players like McDavid and Mackinnon, the brute force and prowess of Ovechkin, and the finesse and inventive spirit of the emerging generation. My commitment is to employ modern teaching methodologies and advanced skating techniques, whilst emphasizing the importance of foundational skills and the fundamentals of hockey. As we navigate this new era of hockey, I invite you to partake in the premier modern hockey training program and evolve into the best hockey player you can be.",
    signature: '~Coach Will.',
    certifications: [
      'Safe Sport Certified',
      'Fully Insured',
      'USA Hockey Certified Coach',
      "Currently coaching MYHA 14's",
    ],
    experience_years: {
      coaching: 6,
      playing: 23,
    },
    service_area: 'DMV (DC, Maryland, Virginia)',
    isPrimary: true,
  },
  {
    id: 'dennis-nayandin',
    name: 'Coach Dennis Nayandin',
    title: 'Assistant Coach',
    image: '/assets/images/coaches/dennis-n-coach.webp',
    quickSummary:
      'Late-starting hockey player who rapidly progressed from beginning at age 14 to playing junior hockey by 18. Now plays adult league and brings enthusiasm, speed, and a passion for teaching to the coaching staff.',
    bio: {
      intro:
        "Coach Dennis is proof that it's never too late to start hockey. Born in Michigan to Russian parents and raised in Virginia, Dennis discovered hockey at 14 and quickly fell in love with the sport. Through dedicated training and an unwavering commitment to improvement, he achieved what many thought impossible—progressing from a beginner to junior hockey in just four years.",
      experience:
        'Dennis played for the George Mason University (GMU) D3 NCAA Club team before transitioning to adult league hockey, where he continues to compete today. A left-handed shooter known for his exceptional speed on the ice, Dennis loves helping Coach Will whenever the opportunity arises and has developed a genuine passion for teaching the game to others. His unique journey from late starter to competitive player gives him valuable insight into the challenges new players face.',
    },
    funFact:
      'Dennis is friends with Russian NHL stars Alexander Ovechkin, Evgeny Kuznetsov, and Dmitry Orlov—and he claims to be faster than Coach Will on the ice!',
    isPrimary: false,
  },
];

// Legacy export for backward compatibility (if needed elsewhere)
export const coachInfo = coaches[0];
