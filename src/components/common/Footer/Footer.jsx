import { Link } from 'react-router-dom';
import { HiMail, HiPhone } from 'react-icons/hi';
import { FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/coach-will', label: 'Coach Will' },
    { path: '/testimonials', label: 'Testimonials' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/contact', label: 'Contact' },
    { path: '/register', label: 'Event Schedule & Registration' }
  ];

  return (
    <footer className="bg-primary border-t border-neutral-dark mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="text-2xl font-display font-bold mb-4">
              <span className="gradient-text">New Era</span>
              <span className="text-white ml-2">Hockey</span>
            </div>
            <p className="text-neutral-text text-sm">
              Premier hockey training in the DMV area. Developing athletes and better people through passion, discipline, and results.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <nav className="space-y-2">
              {navLinks.map((link) => (
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
                href="mailto:Nehockeytraining@outlook.com"
                className="flex items-center gap-2 text-neutral-text hover:text-white transition-colors text-sm"
              >
                <HiMail className="w-5 h-5 text-accent-red" />
                Nehockeytraining@outlook.com
              </a>
              <a
                href="tel:+15712744691"
                className="flex items-center gap-2 text-neutral-text hover:text-white transition-colors text-sm"
              >
                <HiPhone className="w-5 h-5 text-accent-blue" />
                (571) 274-4691
              </a>
              <a
                href="https://www.instagram.com/NewEraHockeyDMV"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-neutral-text hover:text-white transition-colors text-sm"
              >
                <FaInstagram className="w-5 h-5 text-accent-gold" />
                @NewEraHockeyDMV
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-neutral-dark text-center text-neutral-text text-sm">
          <p>&copy; 2025 by New Era Hockey. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
