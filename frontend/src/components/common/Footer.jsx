import React from 'react';

export const Footer = () => {
    return (
        <footer className="mt-12 text-gray-600 text-sm text-center w-full pb-6 select-none">
            &copy; {new Date().getFullYear()} - Sistema de Recursos Humanos - Mendoza y Doicela
        </footer>
    );
};
