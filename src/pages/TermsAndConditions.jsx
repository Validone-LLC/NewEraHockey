import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Card from '@components/common/Card/Card';
import SEO from '@components/common/SEO/SEO';

const termsAndConditions = {
  lastUpdated: 'January 2026',
  sections: [
    {
      id: 'agreement',
      title: 'Agreement to Terms',
      content: [
        'By accessing and using New Era Hockey services, you agree to be bound by these Terms and Conditions. These terms apply to all users of our training programs, camps, events, and website.',
        'If you disagree with any part of these terms, you may not access our services.',
      ],
    },
    {
      id: 'services',
      title: 'Training Services',
      content: [
        'New Era Hockey provides premium hockey training services in the DMV area, including private coaching, group sessions, camps, and specialized training programs.',
        'All training sessions are conducted by qualified coaches led by Coach William, focusing on skill development, skating techniques, and hockey fundamentals.',
        'Session schedules, locations, and availability are subject to change. We will provide reasonable notice of any modifications.',
        'Participants must arrive on time and prepared with appropriate equipment. Late arrivals may result in shortened session time without refund.',
      ],
    },
    {
      id: 'registration',
      title: 'Registration and Payment',
      content: [
        'This website serves as an informational resource for New Era Hockey services. Registration for programs and events is handled through direct contact with our coaching staff via email, phone, or in-person consultation.',
        'When our online event registration system becomes available, it will collect basic contact information (name, email, phone number) only. Payment arrangements and program details will be coordinated separately.',
        'Payment is due at the time of registration unless alternative arrangements have been made. Payment methods (cash, Venmo, or other arrangements) will be communicated directly by our staff.',
        'All fees are in USD and are non-refundable except as specifically outlined in our cancellation policy.',
        'We reserve the right to cancel or modify programs due to insufficient enrollment, facility issues, or other unforeseen circumstances. In such cases, full refunds will be provided.',
      ],
    },
    {
      id: 'cancellation',
      title: 'Cancellation Policy',
      content: [
        'Camps: All camp registrations are non-refundable. Once registered for a camp, fees cannot be refunded regardless of cancellation timing.',
        'Lessons: Individual lessons must be canceled at least 48 hours before the scheduled lesson time to be eligible for a refund. Cancellations made less than 48 hours before a lesson are non-refundable.',
        'New Era Hockey reserves the right to cancel sessions due to weather, facility closures, or other circumstances beyond our control. Affected participants will be notified promptly and offered rescheduling options or full refunds.',
        'No-shows forfeit the session fee and training time without refund or rescheduling option.',
        "For any questions or concerns regarding cancellations, please contact Coach Will directly. We're happy to help!",
      ],
    },
    {
      id: 'liability',
      title: 'Assumption of Risk and Liability',
      content: [
        'Hockey is a physical sport that carries inherent risks of injury. By participating in New Era Hockey programs, participants acknowledge and accept these risks.',
        'All participants must have adequate health insurance coverage. New Era Hockey is not responsible for medical expenses resulting from injuries sustained during training.',
        'Participants and guardians (for minors) agree to release New Era Hockey, its coaches, employees, and affiliates from liability for injuries or damages occurring during training sessions.',
        'Participants must disclose any medical conditions, injuries, or physical limitations that may affect their ability to safely participate in training activities.',
      ],
    },
    {
      id: 'equipment',
      title: 'Equipment and Safety',
      content: [
        'Participants must wear appropriate hockey equipment including helmet, gloves, skates, and protective gear as required by the facility and training activity.',
        'All equipment must be in good condition and properly fitted. Coaches may refuse participation if equipment is deemed unsafe.',
        'New Era Hockey is not responsible for lost, stolen, or damaged personal equipment.',
        'Participants must follow all safety guidelines and facility rules during training sessions.',
      ],
    },
    {
      id: 'conduct',
      title: 'Code of Conduct',
      content: [
        'All participants must demonstrate respect, sportsmanship, and professionalism toward coaches, staff, other participants, and facility personnel.',
        'Bullying, harassment, discrimination, or abusive behavior of any kind will not be tolerated and may result in immediate dismissal from programs without refund.',
        'Participants must follow all instructions from coaches and staff regarding training activities and facility usage.',
        'Parents and guardians are expected to support a positive training environment and address concerns through appropriate channels.',
      ],
    },
    {
      id: 'media',
      title: 'Media and Photography',
      content: [
        'New Era Hockey may photograph or video record training sessions for promotional, educational, or documentation purposes.',
        "By participating in our programs, you consent to the use of your or your child's image in marketing materials, social media, and website content unless you explicitly opt out in writing.",
        'Participants may photograph or record their own training for personal use but may not share content featuring other participants without consent.',
      ],
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      content: [
        'All training materials, methodologies, and content provided by New Era Hockey are proprietary and protected by copyright.',
        'Participants may not reproduce, distribute, or commercially exploit any training materials without written permission.',
        'The New Era Hockey name, logo, and branding are trademarks and may not be used without authorization.',
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy and Data',
      content: [
        'Personal information collected through our contact form or during registration is used solely for program administration and communication.',
        'Our website collects name, email address, and phone number only. No payment or billing information is collected through this website.',
        'We do not sell or share participant information with third parties except as required by law or as necessary to provide our services.',
        'For complete details on data collection and usage, please review our Privacy Policy.',
      ],
    },
    {
      id: 'modifications',
      title: 'Modifications to Terms',
      content: [
        'New Era Hockey reserves the right to modify these Terms and Conditions at any time.',
        'Changes will be posted on our website with an updated "Last Updated" date.',
        'Continued use of our services after changes constitute acceptance of modified terms.',
        'For significant changes, we will make reasonable efforts to notify registered participants.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact Information',
      content: [
        'For questions regarding these Terms and Conditions, please contact us:',
        'Email: coachwill@newerahockeytraining.com',
        'Phone: (571) 274-4691',
        'Instagram: @NewEraHockeyDMV',
      ],
    },
  ],
};

const TermsAndConditions = () => {
  const [activeSection, setActiveSection] = useState(null);

  const scrollToSection = sectionId => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <SEO pageKey="terms-and-conditions" />
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
                <span className="gradient-text">TERMS & CONDITIONS</span>
              </h1>
              <p className="text-xl text-neutral-light max-w-2xl mx-auto">
                Please review our terms of service
              </p>
              <p className="text-sm text-neutral-text mt-4">
                Last Updated: {termsAndConditions.lastUpdated}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="section-container">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sticky Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="lg:sticky lg:top-24">
                <Card>
                  <h2 className="text-xl font-display font-bold text-white mb-4">
                    Table of Contents
                  </h2>
                  <nav className="space-y-2">
                    {termsAndConditions.sections.map((section, index) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-start gap-2 group ${
                          activeSection === section.id
                            ? 'bg-primary-light text-white'
                            : 'text-neutral-light hover:text-white hover:bg-primary-light/50'
                        }`}
                      >
                        <span className="text-teal-500 font-semibold flex-shrink-0">
                          {index + 1}.
                        </span>
                        <span className="text-sm flex-1">{section.title}</span>
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 transition-transform ${
                            activeSection === section.id ? 'text-teal-500' : 'text-neutral-dark'
                          } group-hover:translate-x-1`}
                        />
                      </button>
                    ))}
                  </nav>
                </Card>
              </div>
            </motion.div>

            {/* Terms Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3 space-y-8"
            >
              {termsAndConditions.sections.map((section, index) => (
                <div key={section.id} id={section.id}>
                  <Card>
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-3xl font-bold text-teal-500">{index + 1}</span>
                      <h2 className="text-2xl font-display font-bold text-white pt-1">
                        {section.title}
                      </h2>
                    </div>
                    <div className="space-y-4 ml-12">
                      {section.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-neutral-light leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </Card>
                </div>
              ))}

              {/* Back to Top */}
              <div className="text-center pt-8">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 text-teal-500 hover:text-teal-400 transition-colors font-semibold"
                >
                  Back to Top
                  <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
                </button>
              </div>

              {/* Additional Links */}
              <Card>
                <div className="text-center">
                  <p className="text-neutral-light mb-4">Have questions about our terms?</p>
                  <Link
                    to="/contact"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all"
                  >
                    Contact Us
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default TermsAndConditions;
