import { motion } from 'framer-motion';
import { Mail, Phone, Instagram } from 'lucide-react';
import SEO from '@components/common/SEO/SEO';
import ContactForm from '@components/contact/ContactForm/ContactForm';
import Card from '@components/common/Card/Card';
import Button from '@components/common/Button/Button';

const Contact = () => {
  return (
    <div className="min-h-screen">
      <SEO pageKey="contact" />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
              <span className="gradient-text">CONTACT</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              Get in touch with Coach Will and the New Era Hockey team
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-display font-bold text-white mb-8">Talk To Us</h2>

            <div className="space-y-6">
              <Card hover={false}>
                <h3 className="text-lg font-semibold text-white mb-4">Email:</h3>
                <a
                  href="mailto:coachwill@newerahockeytraining.com"
                  className="flex items-center gap-3 text-neutral-light hover:text-white transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg">coachwill@newerahockeytraining.com</span>
                </a>
              </Card>

              <Card hover={false}>
                <h3 className="text-lg font-semibold text-white mb-4">Phone:</h3>
                <a
                  href="tel:+15712744691"
                  className="flex items-center gap-3 text-neutral-light hover:text-white transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg">(571) 274-4691</span>
                </a>
              </Card>

              <Card hover={false}>
                <h3 className="text-lg font-semibold text-white mb-4">Instagram:</h3>
                <a
                  href="https://www.instagram.com/NewEraHockeyDMV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-neutral-light hover:text-white transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-300 to-teal-500 flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-lg">@NewEraHockeyDMV</span>
                </a>
              </Card>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-display font-bold text-white mb-8">Get In Touch</h2>
            <Card hover={false}>
              <ContactForm />
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="section-container bg-primary/30 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold text-white mb-6">Have Questions?</h2>
          <p className="text-neutral-light mb-8 text-lg max-w-2xl mx-auto">
            Check out our Frequently Asked Questions page for answers to common inquiries about
            training programs, schedules, and more
          </p>
          <Button to="/faq" variant="primary">
            View FAQs
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;
