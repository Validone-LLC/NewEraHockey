import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiChevronRight } from 'react-icons/hi';
import Card from '@components/common/Card/Card';
import { privacyPolicy } from '@data/privacyPolicy';

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
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
              <span className="gradient-text">PRIVACY POLICY</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              How we protect and handle your information
            </p>
            <p className="text-sm text-neutral-text mt-4">
              Last Updated: {privacyPolicy.lastUpdated}
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
                  {privacyPolicy.sections.map((section, index) => (
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
                      <HiChevronRight
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

          {/* Privacy Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 space-y-8"
          >
            {privacyPolicy.sections.map((section, index) => (
              <div key={section.id} id={section.id}>
                <Card>
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-3xl font-bold text-teal-500">
                      {index + 1}
                    </span>
                    <h2 className="text-2xl font-display font-bold text-white pt-1">
                      {section.title}
                    </h2>
                  </div>
                  <div className="space-y-4 ml-12">
                    {section.content.map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className="text-neutral-light leading-relaxed whitespace-pre-line"
                      >
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
                <HiChevronRight className="w-4 h-4 rotate-[-90deg]" />
              </button>
            </div>

            {/* Additional Links */}
            <Card>
              <div className="text-center">
                <p className="text-neutral-light mb-4">
                  Questions about our privacy practices?
                </p>
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
  );
};

export default PrivacyPolicy;
