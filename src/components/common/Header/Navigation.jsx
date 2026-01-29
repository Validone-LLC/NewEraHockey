import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { headerNavLinks } from '@/config/navigation';

const Navigation = ({ mobile = false }) => {
  const linkClasses = ({ isActive }) => `
    ${mobile ? 'block py-3 px-4 text-lg' : 'px-4 py-2'}
    font-medium transition-colors duration-200
    ${isActive ? 'text-teal-500' : 'text-neutral-light hover:text-white'}
  `;

  if (mobile) {
    return (
      <nav aria-label="Main navigation" className="space-y-2">
        {headerNavLinks.map((link, index) => (
          <motion.div
            key={link.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink to={link.path} className={linkClasses}>
              {link.label}
            </NavLink>
          </motion.div>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Main navigation" className="flex items-center space-x-1">
      {headerNavLinks.map(link => (
        <NavLink key={link.path} to={link.path} className={linkClasses}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
