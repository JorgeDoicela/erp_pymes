/**
 * @file Footer.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-12 text-gray-600 text-sm text-center w-full pb-6 select-none">
      &copy; {new Date().getFullYear()} Norma · Sistema de Gestión y Cumplimiento Laboral para PyMEs
    </footer>
  );
};

export default Footer;
