import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Navigation from './Navigation';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const mobileMenuRef = useRef(null);
  const hamburgerRef = useRef(null);

  // Throttled scroll handler (~200ms)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Mobile menu focus trap
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    // Focus first link in mobile menu
    const raf = requestAnimationFrame(() => {
      const firstLink = mobileMenuRef.current?.querySelector(FOCUSABLE_SELECTOR);
      firstLink?.focus();
    });

    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        hamburgerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;

      // Include hamburger button in the focus trap so user can close the menu
      const menuFocusables = Array.from(
        mobileMenuRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []
      );
      const allFocusables = [hamburgerRef.current, ...menuFocusables].filter(Boolean);
      if (allFocusables.length === 0) return;

      const firstEl = allFocusables[0];
      const lastEl = allFocusables[allFocusables.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-primary/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/assets/images/logo/neh-logo.png"
              alt="New Era Hockey Logo"
              className="h-12 w-auto"
            />
            <motion.div className="text-2xl sm:text-3xl font-display font-bold hidden sm:block">
              <span className="gradient-text">New Era</span>
              <span className="text-white ml-2">Hockey</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <Navigation />
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={hamburgerRef}
            className="lg:hidden text-white p-2 hover:bg-primary-light rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            id="mobile-menu"
            className="lg:hidden bg-primary border-t border-neutral-dark"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-6">
              <Navigation mobile />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
