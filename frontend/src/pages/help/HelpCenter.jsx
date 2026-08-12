import React, { useState, useMemo } from 'react';
import {
    FiBook, FiUser, FiShield, FiCalendar,
    FiDollarSign, FiSearch, FiChevronDown,
    FiClock, FiBriefcase, FiBarChart2, FiActivity, FiTarget,
    FiHelpCircle, FiArrowRight, FiUsers,
    FiGift, FiFileText, FiTrendingUp
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const HelpSection = ({ title, icon: Icon, children, isOpen, onToggle }) => (
    <div className="border border-gray-200 rounded bg-white hover:border-gray-300 transition-colors mb-2.5 overflow-hidden">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left"
        >
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white text-blue-600 rounded border border-gray-200 shrink-0">
                    <Icon size={16} />
                </div>
                <span className="font-semibold text-gray-900 text-xs">{title}</span>
            </div>
            <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400"
            >
                <FiChevronDown size={16} />
            </motion.div>
        </button>
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                    <div className="p-3.5 text-xs text-gray-700 space-y-2 border-t border-gray-100 leading-relaxed bg-white">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const HelpCenter = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('general');
    const [openSections, setOpenSections] = useState({});

    const toggleSection = (sectionId) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const categories = [
        { id: 'general', label: 'General', icon: FiBook },
        { id: 'employee', label: 'Para Personal', icon: FiUser },
        { id: 'management', label: 'Gestión RRHH', icon: FiUsers },
        { id: 'finance', label: 'Finanzas y Nómina', icon: FiDollarSign },
        { id: 'talent', label: 'Talento y Desempeño', icon: FiTarget },
        { id: 'analytics', label: 'Auditoría y Análisis', icon: FiBarChart2 },
    ];

    const helpData = {
        general: [
            {
                id: 'g1',
                title: 'Introducción a la Plataforma ERP',
                icon: FiBriefcase,
                content: (
                    <>
                        <p><strong>EMPLIFI</strong> es un ecosistema integral de gestión de capital humano y contabilidad operativa para PyMEs.</p>
                        <ul className="list-disc pl-4 space-y-1 mt-1.5 text-gray-600">
                            <li><strong>Interfaz Unificada:</strong> Un solo panel centralizado para todas las operaciones administrativas.</li>
                            <li><strong>Permisos por Rol:</strong> Los menús y funciones se ajustan según tu perfil asignado.</li>
                            <li><strong>Acceso Web:</strong> Disponible 24/7 desde cualquier navegador.</li>
                        </ul>
                    </>
                )
            },
            {
                id: 'g2',
                title: 'Seguridad y Protección de Datos',
                icon: FiShield,
                content: (
                    <>
                        <p>Garantizamos la integridad de la información sensible del personal:</p>
                        <ul className="list-disc pl-4 space-y-1 mt-1.5 text-gray-600">
                            <li><strong>Encriptación:</strong> Datos bancarios y de nómina protegidos con estándares AES-256.</li>
                            <li><strong>Validación Geográfica:</strong> Marcaciones de asistencia verificadas en ubicación autorizada.</li>
                            <li><strong>Auditoría Forense:</strong> Registro inmutable de cada transacción e inicio de sesión.</li>
                        </ul>
                    </>
                )
            }
        ],
        employee: [
            {
                id: 'e1',
                title: 'Registro de Asistencia Diaria',
                icon: FiClock,
                content: (
                    <>
                        <p>Registra tu jornada laboral de forma rápida:</p>
                        <ul className="list-disc pl-4 space-y-1 mt-1.5 text-gray-600">
                            <li>Cálculo automático de horas trabajadas y atrasos.</li>
                            <li>Sincronización en tiempo real con el panel de administración.</li>
                        </ul>
                    </>
                )
            },
            {
                id: 'e2',
                title: 'Solicitud de Permisos y Vacaciones',
                icon: FiCalendar,
                content: (
                    <p>Gestiona solicitudes de vacaciones o justificantes médicos desde tu portal de empleado adjuntando comprobantes digitales.</p>
                )
            },
            {
                id: 'e3',
                title: 'Consulta de Roles de Pago',
                icon: FiDollarSign,
                content: (
                    <p>Visualiza y descarga tus comprobantes de pago de nómina con desglose de sueldo base, bonos e impositivos.</p>
                )
            }
        ],
        management: [
            {
                id: 'm1',
                title: 'Administración de Expedientes de Empleados',
                icon: FiUsers,
                content: (
                    <p>Control de datos personales, cédulas, contratos laborales y distribución por departamento.</p>
                )
            },
            {
                id: 'm2',
                title: 'Reclutamiento y Vacantes',
                icon: FiBriefcase,
                content: (
                    <p>Publicación de ofertas de trabajo, recepción de postulaciones y seguimiento de procesos de selección.</p>
                )
            }
        ],
        finance: [
            {
                id: 'f1',
                title: 'Generación Masiva de Nómina',
                icon: FiActivity,
                content: (
                    <p>Procesamiento mensual de salarios, cálculo de horas extras, retenciones de ley y exportación bancaria.</p>
                )
            },
            {
                id: 'f2',
                title: 'Contabilidad e Integración de Asientos',
                icon: FiDollarSign,
                content: (
                    <p>Plan de cuentas, contabilidad por partida doble, asientos automáticos y balance de comprobación de sumas y saldos.</p>
                )
            }
        ],
        talent: [
            {
                id: 't1',
                title: 'Evaluaciones de Desempeño',
                icon: FiTrendingUp,
                content: (
                    <p>Creación de encuestas por competencias, métricas de cumplimiento y retroalimentación contínua.</p>
                )
            }
        ],
        analytics: [
            {
                id: 'a1',
                title: 'Auditoría Global y Logs del Sistema',
                icon: FiShield,
                content: (
                    <p>Historial inmutable de auditoría con dirección IP, timestamp y detalle de cambios por usuario.</p>
                )
            }
        ]
    };

    const filteredSections = useMemo(() => {
        if (!searchTerm) return helpData[activeTab] || [];
        
        const term = searchTerm.toLowerCase();
        const allItems = Object.values(helpData).flat();
        return allItems.filter(item => 
            item.title.toLowerCase().includes(term)
        );
    }, [searchTerm, activeTab]);

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Soporte · Documentación</p>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <FiHelpCircle className="text-blue-600" /> Centro de Ayuda & Guías Operativas
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manuales de uso, preguntas frecuentes y documentación técnica de la plataforma.</p>
                </div>
            </div>

            {/* Buscador */}
            <div className="relative max-w-xl">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                    type="text"
                    placeholder="Buscar tema o guía operativa (ej. Nómina, Asistencia, Asientos...)"
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Navegación por Categorías + Contenido */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {/* Menú de categorías */}
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Categorías</p>
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeTab === cat.id && !searchTerm;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveTab(cat.id);
                                    setSearchTerm('');
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors text-left cursor-pointer ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Lista de guías / artículos */}
                <div className="md:col-span-3 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            {searchTerm ? `Resultados para "${searchTerm}"` : categories.find(c => c.id === activeTab)?.label}
                        </h2>
                        <span className="text-[11px] font-mono text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                            {filteredSections.length} guías
                        </span>
                    </div>

                    {filteredSections.length > 0 ? (
                        <div>
                            {filteredSections.map((item) => (
                                <HelpSection
                                    key={item.id}
                                    title={item.title}
                                    icon={item.icon}
                                    isOpen={openSections[item.id]}
                                    onToggle={() => toggleSection(item.id)}
                                >
                                    {item.content}
                                </HelpSection>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-400 text-xs bg-white rounded border border-gray-200">
                            <p className="text-sm font-medium text-gray-700">Sin resultados</p>
                            <p className="text-xs text-gray-400 mt-1">Prueba con otras palabras clave o selecciona una categoría.</p>
                        </div>
                    )}

                    {/* Banner de contacto a soporte */}
                    <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-900">¿Requiere asistencia técnica adicional?</h3>
                            <p className="text-xs text-gray-500 mt-0.5">El canal de atención a empresas está disponible para soporte operativo.</p>
                        </div>
                        <a 
                            href="https://wa.me/593969677280" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                            Contactar Soporte Técnico <FiArrowRight size={12} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
