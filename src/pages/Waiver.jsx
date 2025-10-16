import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiChevronRight, HiExclamationCircle } from 'react-icons/hi';
import Card from '@components/common/Card/Card';
import waiverData from '@data/waiver.json';

const Waiver = () => {
  const [activeSection, setActiveSection] = useState(null);

  const scrollToSection = sectionId => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-orange-500/10 border border-orange-500/30 rounded-full">
              <HiExclamationCircle className="w-6 h-6 text-orange-500" />
              <span className="text-orange-400 font-semibold">Important Legal Notice</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
              <span className="gradient-text">LIABILITY WAIVER</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-3xl mx-auto">
              Release of Liability, Assumption of Risk, and Indemnity Agreement
            </p>
            <p className="text-sm text-neutral-text mt-4">Last Updated: {waiverData.lastUpdated}</p>
          </motion.div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
            <div className="flex items-start gap-4">
              <HiExclamationCircle className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Please Read Carefully</h3>
                <p className="text-neutral-light leading-relaxed mb-3">
                  By participating in New Era Hockey training programs, camps, events, or any
                  hockey-related activities, you acknowledge and agree to the terms of this
                  Liability Waiver. This is a legally binding agreement that affects your legal
                  rights.
                </p>
                <p className="text-sm text-orange-400 font-semibold">
                  This waiver includes a release of liability, assumption of risk, and
                  indemnification provisions. If you do not agree to these terms, you may not
                  participate in New Era Hockey activities.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
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
                  {waiverData.sections.map((section, index) => (
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

                {/* Quick Info */}
                <div className="mt-6 p-4 bg-primary-light rounded-lg">
                  <h3 className="text-sm font-semibold text-white mb-2">Need Help?</h3>
                  <p className="text-xs text-neutral-light mb-3">Questions about this waiver?</p>
                  <Link
                    to="/contact"
                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                  >
                    Contact Us
                    <HiChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Waiver Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 space-y-8"
          >
            {waiverData.sections.map((section, index) => (
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
                <HiChevronRight className="w-4 h-4 rotate-[-90deg]" />
              </button>
            </div>

            {/* Contact Card */}
            <Card>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-3">Questions or Concerns?</h3>
                <p className="text-neutral-light mb-4 max-w-2xl mx-auto">
                  If you have questions about this waiver or need clarification on any terms, please
                  contact us before participating in New Era Hockey activities.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    to="/contact"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all"
                  >
                    Contact Us
                  </Link>
                  <Link
                    to="/terms-and-conditions"
                    className="inline-block px-6 py-3 bg-primary-light text-white font-semibold rounded-lg hover:bg-primary transition-all"
                  >
                    View Terms & Conditions
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Waiver;
