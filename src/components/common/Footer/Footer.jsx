import { Link } from 'react-router-dom';
import { HiMail, HiPhone } from 'react-icons/hi';
import { FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/coaches', label: 'Coaches' },
    { path: '/testimonials', label: 'Testimonials' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/faq', label: 'FAQ' },
    { path: '/contact', label: 'Contact' },
    { path: '/event-registration', label: 'Event Registration' },
  ];

  return (
    <footer className="bg-primary border-t border-neutral-dark mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/assets/images/logo/neh-logo.png"
                alt="New Era Hockey Logo"
                className="h-12 w-auto"
              />
              <div className="text-2xl font-display font-bold">
                <span className="gradient-text">New Era</span>
                <span className="text-white ml-2">Hockey</span>
              </div>
            </div>
            <p className="text-neutral-text text-sm">
              Private on ice & Off ice training, annual camps, and film analysis
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <nav className="space-y-2">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-neutral-text hover:text-white transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Get In Touch</h3>
            <div className="space-y-3">
              <a
                href="mailto:coachwill@newerahockeytraining.com"
                className="flex items-center gap-2 text-neutral-text hover:text-white transition-colors text-sm"
              >
                <HiMail className="w-5 h-5 text-teal-400" />
                coachwill@newerahockeytraining.com
              </a>
              <a
                href="tel:+15712744691"
                className="flex items-center gap-2 text-neutral-text hover:text-white transition-colors text-sm"
              >
                <HiPhone className="w-5 h-5 text-teal-500" />
                (571) 274-4691
              </a>
              <a
                href="https://www.instagram.com/NewEraHockeyDMV"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-neutral-text hover:text-white transition-colors text-sm"
              >
                <FaInstagram className="w-5 h-5 text-teal-600" />
                @NewEraHockeyDMV
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-neutral-dark">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-text text-sm">
            <p>&copy; 2025 by New Era Hockey. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <span className="text-neutral-dark">|</span>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span className="text-neutral-dark">|</span>
              <Link to="/waiver" className="hover:text-white transition-colors">
                Waiver
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
