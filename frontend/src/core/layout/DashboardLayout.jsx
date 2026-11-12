/**
 * @file DashboardLayout.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { DeveloperCard } from '@core/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const DashboardLayout = ({ children, user, onLogout, title }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(() => {
    const saved = localStorage.getItem('desktop_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });
  const location = useLocation();

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleToggleMenu = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsDesktopOpen((prev) => {
        const nextState = !prev;
        localStorage.setItem('desktop_sidebar_open', String(nextState));
        return nextState;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex overflow-x-hidden">
      {/* Desktop Sidebar con animación de deslizamiento y ocultamiento */}
      <aside
        className={`hidden md:block fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out ${
          isDesktopOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar user={user} onLogout={onLogout} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-50 md:hidden bg-white shadow-xl"
            >
              <Sidebar user={user} onLogout={onLogout} onClose={() => setIsMobileMenuOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content que se expande a todo el ancho cuando el sidebar está oculto */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 w-full transition-all duration-300 ease-in-out ${
          isDesktopOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <Header
          user={user}
          onMenuClick={handleToggleMenu}
          onLogout={onLogout}
          isSidebarOpen={isDesktopOpen}
          title={title}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0 w-full">
          <div className="max-w-7xl mx-auto w-full min-w-0">{children}</div>
        </main>
      </div>
      <DeveloperCard />
    </div>
  );
};

export default DashboardLayout;
