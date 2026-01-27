import React, { useState } from 'react';
import {
    FiBook, FiUser, FiShield, FiCalendar,
    FiDollarSign, FiSearch, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const HelpSection = ({ title, icon: Icon, children, isOpen, onToggle }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Icon size={20} />
                </div>
                <span className="font-semibold text-gray-700">{title}</span>
            </div>
            {isOpen ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white"
                >
                    <div className="p-4 text-gray-600 space-y-3 prose prose-indigo max-w-none">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const HelpCenter = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openSections, setOpenSections] = useState({
        general: true,
        employee: false,
        admin: false
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Centro de Ayuda y Manuales</h1>
                <p className="text-gray-600">Todo lo que necesitas saber para utilizar el sistema de Recursos Humanos</p>

                <div className="mt-6 relative max-w-xl mx-auto">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="¿Qué estás buscando? (ej. Registro de asistencia, Nómina...)"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid gap-2">
                <HelpSection
                    title="Guía General del Sistema"
                    icon={FiBook}
                    isOpen={openSections.general}
                    onToggle={() => toggleSection('general')}
                >
                    <p>Bienvenido al Sistema de Gestión de Recursos Humanos. Este sistema está diseñado para ser intuitivo y eficiente.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Navegación:</strong> Utilice la barra lateral izquierda para acceder a los diferentes módulos.</li>
                        <li><strong>Búsqueda:</strong> La mayoría de los listados incluyen una barra de búsqueda para encontrar información rápidamente.</li>
                        <li><strong>Responsividad:</strong> El sistema se adapta automáticamente a computadoras, tablets y dispositivos móviles.</li>
                    </ul>
                </HelpSection>

                <HelpSection
                    title="Manual para Empleados"
                    icon={FiUser}
                    isOpen={openSections.employee}
                    onToggle={() => toggleSection('employee')}
                >
                    <h4 className="font-bold text-gray-800">1. Registro de Asistencia</h4>
                    <p>Para registrar su entrada o salida, diríjase a <strong>"Mi Asistencia"</strong>. El sistema detectará automáticamente si es su primer registro del día.</p>

                    <h4 className="font-bold text-gray-800">2. Solicitud de Ausencias</h4>
                    <p>En el módulo de <strong>"Ausencias"</strong>, puede solicitar permisos médicos o vacaciones. Asegúrese de adjuntar la evidencia necesaria (PDF o Imagen).</p>

                    <h4 className="font-bold text-gray-800">3. Ver Mis Pagos</h4>
                    <p>Puede consultar y descargar sus roles de pago en la sección <strong>"Mis Pagos"</strong>.</p>
                </HelpSection>

                <HelpSection
                    title="Manual para Administradores"
                    icon={FiShield}
                    isOpen={openSections.admin}
                    onToggle={() => toggleSection('admin')}
                >
                    <h4 className="font-bold text-gray-800">1. Gestión de Empleados</h4>
                    <p>Desde el menú <strong>"Empleados"</strong>, puede registrar nuevos colaboradores, editar su información y gestionar su estado (activo/inactivo).</p>

                    <h4 className="font-bold text-gray-800">2. Configuración de Nómina</h4>
                    <p>Configure beneficios, deducciones y genere los roles de pago mensuales desde el módulo de <strong>"Nómina"</strong>.</p>

                    <h4 className="font-bold text-gray-800">3. Auditoría y Seguridad</h4>
                    <p>Puede revisar cada acción realizada en el sistema desde el log de <strong>"Auditoría"</strong> para garantizar la transparencia.</p>
                </HelpSection>
            </div>

            <footer className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-indigo-900">¿Necesitas ayuda adicional?</h3>
                    <p className="text-indigo-700 text-sm">Contáctate con el departamento de soporte técnico.</p>
                </div>
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                    Contactar Soporte
                </button>
            </footer>
        </div>
    );
};

export default HelpCenter;
