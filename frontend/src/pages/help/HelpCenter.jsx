import React, { useState, useMemo } from 'react';
import {
    FiBook, FiUser, FiShield, FiCalendar,
    FiDollarSign, FiSearch, FiChevronDown, FiChevronUp,
    FiClock, FiBriefcase, FiBarChart2, FiActivity, FiTarget,
    FiExternalLink, FiHelpCircle, FiArrowRight, FiUsers,
    FiGift, FiFileText, FiTrendingUp
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const HelpSection = ({ title, icon: Icon, children, isOpen, onToggle }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-sm bg-white hover:border-indigo-200 transition-colors">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white text-indigo-600 rounded-lg shadow-sm border border-slate-100">
                    <Icon size={22} />
                </div>
                <span className="font-bold text-slate-700 text-lg text-left">{title}</span>
            </div>
            <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-slate-400"
            >
                <FiChevronDown size={20} />
            </motion.div>
        </button>
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <div className="p-5 text-slate-600 space-y-4 border-t border-slate-100 leading-relaxed">
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
                title: 'Introducción a EMPLIFI',
                icon: FiBriefcase,
                content: (
                    <>
                        <p><strong>EMPLIFI</strong> es un ecosistema integral de gestión de capital humano. Integra desde el control de asistencia básico hasta contabilidad avanzada y análisis preventivo (Análisis Predictivo).</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Interfaz Unificada:</strong> Un solo lugar para todas las gestiones administrativas.</li>
                            <li><strong>Roles Dinámicos:</strong> Los permisos cambian lo que ves en la barra lateral.</li>
                            <li><strong>Acceso 24/7:</strong> Disponible desde cualquier dispositivo con conexión a internet.</li>
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
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Encriptación:</strong> Datos bancarios y de nómina protegidos.</li>
                            <li><strong>Geolocalización:</strong> Opcional en marcaciones para validar la presencia en sitio.</li>
                            <li><strong>Prevención de Fraude:</strong> Detección automática de intentos de marcación vía VPN o cambio de hora manual.</li>
                        </ul>
                    </>
                )
            }
        ],
        employee: [
            {
                id: 'e1',
                title: 'Ciclo de Asistencia Diaria',
                icon: FiClock,
                content: (
                    <>
                        <p>Registra tu entrada y salida con un solo clic. El sistema calcula automáticamente:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li>Horas laboradas totales.</li>
                            <li>Atrasos y entradas anticipadas.</li>
                            <li>Horas extras (sujeto a aprobación administrativa).</li>
                        </ul>
                    </>
                )
            },
            {
                id: 'e2',
                title: 'Gestión de Permisos y Vacaciones',
                icon: FiCalendar,
                content: (
                    <>
                        <p>Solicita tiempo libre de forma digital:</p>
                        <ol className="list-decimal pl-5 space-y-2 mt-2">
                            <li>Indica el tipo de permiso (Enfermedad, Calamidad, etc).</li>
                            <li>Selecciona el rango de fechas.</li>
                            <li>Adjunta justificantes médicos o fotos de respaldo.</li>
                            <li>Recibe notificaciones cuando el administrador apruebe o rechace.</li>
                        </ol>
                    </>
                )
            },
            {
                id: 'e3',
                title: 'Roles de Pago y Certificados',
                icon: FiDollarSign,
                content: (
                    <p>Accede a tus comprobantes de pago de los últimos 12 meses. Puedes descargar el PDF oficial para trámites externos o verificar el desglose de tus beneficios sociales.</p>
                )
            }
        ],
        management: [
            {
                id: 'm1',
                title: 'Administración de Expedientes',
                icon: FiUsers,
                content: (
                    <>
                        <p>Control total sobre la información del colaborador:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Contratos:</strong> Gestión de fechas de vencimiento y tipos de contrato.</li>
                            <li><strong>Perfiles:</strong> Actualización de cargos, departamentos y líneas de reporte.</li>
                            <li><strong>Carga Masiva:</strong> Importa empleados desde archivos CSV para puestas en marcha rápidas.</li>
                        </ul>
                    </>
                )
            },
            {
                id: 'm2',
                title: 'Reclutamiento y Selección',
                icon: FiBriefcase,
                content: (
                    <>
                        <p>Centraliza tus procesos de contratación:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Vacantes:</strong> Crea publicaciones que se ven en el portal público de empleo.</li>
                            <li><strong>Candidatos:</strong> Recibe currículums, califica perfiles y mueve a los aplicantes por las etapas del pipeline.</li>
                            <li><strong>Onboarding:</strong> Convierte a un candidato seleccionado en empleado con un solo clic.</li>
                        </ul>
                    </>
                )
            },
            {
                id: 'm3',
                title: 'Planificación de Turnos',
                icon: FiClock,
                content: (
                    <p>Crea horarios rotativos, asigna descansos y gestiona turnos de noche. El sistema validará que no existan traslapes de horarios para el mismo empleado.</p>
                )
            }
        ],
        finance: [
            {
                id: 'f1',
                title: 'Generación Masiva de Nómina',
                icon: FiActivity,
                content: (
                    <>
                        <p>Automatiza el cálculo mensual o quincenal:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Sincronización automática de faltas y horas extras desde el módulo de asistencia.</li>
                            <li>Cálculo de impuestos, aportes al seguro social y fondos de reserva.</li>
                            <li>Generación de archivos bancarios para pagos masivos.</li>
                        </ul>
                    </>
                )
            },
            {
                id: 'f2',
                title: 'Contabilidad e Integración Financiera',
                icon: FiDollarSign,
                content: (
                    <>
                        <p>Conecta los gastos de personal con tu libro mayor:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Plan de Cuentas:</strong> Personaliza cómo se mapean los rubros de nómina a cuentas contables.</li>
                            <li><strong>Asientos Automáticos:</strong> Al cerrar la nómina, se genera el asiento de gasto y pasivo.</li>
                            <li><strong>Centros de Costo:</strong> Distribuye el gasto salarial por departamentos o proyectos específicos.</li>
                        </ul>
                    </>
                )
            },
            {
                id: 'f3',
                title: 'Beneficios y Descuentos',
                icon: FiGift,
                content: (
                    <p>Gestiona bonos recurrentes, anticipos de sueldo, préstamos de oficina y deducciones externas (comisariatos, asociaciones).</p>
                )
            }
        ],
        talent: [
            {
                id: 't1',
                title: 'Evaluaciones 360 y Desempeño',
                icon: FiTrendingUp,
                content: (
                    <>
                        <p>Mide el crecimiento de tu equipo:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Plantillas:</strong> Crea encuestas personalizadas por competencias o KPIs.</li>
                            <li><strong>Ciclos:</strong> Configura evaluaciones anuales o trimestrales.</li>
                            <li><strong>Feedback:</strong> Los empleados pueden ver sus resultados y comentarios de mejora.</li>
                        </ul>
                    </>
                )
            },
            {
                id: 't2',
                title: 'Seguimiento de Objetivos (OKRs)',
                icon: FiTarget,
                content: (
                    <p>Alinea las metas individuales con la visión de la empresa. Los empleados pueden actualizar el progreso de sus objetivos y los gerentes pueden monitorear el cumplimiento global.</p>
                )
            }
        ],
        analytics: [
            {
                id: 'a1',
                title: 'Dashboards de Análisis Predictivo',
                icon: FiActivity,
                content: (
                    <>
                        <p>Utiliza datos para predecir tendencias:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Predictor de Rotación:</strong> Identifica empleados con riesgo de renuncia basado en patrones de comportamiento.</li>
                            <li><strong>Resumen Gerencial:</strong> Vista consolidada de costos, asistencia y productividad.</li>
                        </ul>
                    </>
                )
            },
            {
                id: 'a2',
                title: 'Auditoría Forense y Logs',
                icon: FiShield,
                content: (
                    <p>Cada cambio en el sistema queda registrado. Puedes ver quién modificó un salario, quién borró una marcación o quién aprobó un permiso, incluyendo su dirección IP y dispositivo.</p>
                )
            },
            {
                id: 'a3',
                title: 'Reportes Personalizados',
                icon: FiFileText,
                content: (
                    <p>Genera archivos Excel o PDF de cualquier módulo. Filtra por fechas, sucursales o cargos para obtener exactamente la información que necesitas.</p>
                )
            }
        ]
    };

    const filteredSections = useMemo(() => {
        if (!searchTerm) return helpData[activeTab];
        
        const term = searchTerm.toLowerCase();
        // Obtener todos los artículos de todas las categorías dinámicamente
        const allItems = Object.values(helpData).flat();
        return allItems.filter(item => 
            item.title.toLowerCase().includes(term) || 
            (typeof item.content === 'string' && item.content.toLowerCase().includes(term))
        );
    }, [searchTerm, activeTab]);

    return (
        <div className="min-h-screen bg-slate-50/30 p-4 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold mb-4 border border-indigo-100 shadow-sm"
                    >
                        <FiHelpCircle />
                        <span>CENTRO DE CONOCIMIENTO</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">
                        ¿Cómo podemos <span className="text-indigo-600">ayudarte</span> hoy?
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        Explora los manuales, guías y preguntas frecuentes para dominar todas las herramientas de <span className="font-bold text-slate-700">EMPLIFI</span>.
                    </p>

                    <div className="mt-10 relative max-w-2xl mx-auto">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <FiSearch size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="Busca por módulo o funcionalidad (ej. Nómina, Asistencia...)"
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-indigo-100/20 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Tabs / Navigation sidebar */}
                    <nav className="md:w-64 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">CATEGORÍAS</p>
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
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group
                                        ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                            : 'text-slate-600 hover:bg-white hover:text-indigo-600'
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} />
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <main className="flex-1">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {searchTerm ? (
                                    <>Resultados para <span className="text-indigo-600 italic">"{searchTerm}"</span></>
                                ) : (
                                    <>Contenido de {categories.find(c => c.id === activeTab)?.label}</>
                                )}
                            </h2>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                {filteredSections.length} Artículos
                            </span>
                        </div>

                        {filteredSections.length > 0 ? (
                            <div className="space-y-4">
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
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiSearch className="text-slate-300" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700">No encontramos lo que buscas</h3>
                                <p className="text-slate-500 mt-2">Prueba con palabras clave más generales o navega por categorías.</p>
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="mt-6 text-indigo-600 font-bold hover:underline"
                                >
                                    Ver todas las guías
                                </button>
                            </div>
                        )}

                        <div className="mt-12 p-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FiHelpCircle size={120} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-2">¿Aún tienes dudas?</h3>
                                <p className="text-indigo-100/80 mb-6 max-w-md">Nuestro equipo de soporte técnico está disponible para ayudarte con cualquier inconveniente técnico o duda del sistema.</p>
                                <div className="flex flex-wrap gap-4">
                                    <a 
                                        href="https://wa.me/593969677280" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10"
                                    >
                                        Hablar con Soporte <FiArrowRight />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            
            <footer className="mt-20 text-center pb-12 border-t border-slate-200 pt-8">
                <p className="text-slate-400 text-sm font-medium">
                    © {new Date().getFullYear()} Emplifi · Plataforma ERP para PYMEs
                </p>
                <div className="flex justify-center gap-6 mt-4">
                    <a href="#" className="text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors">POLÍTICA DE PRIVACIDAD</a>
                    <a href="#" className="text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors">TÉRMINOS DE SERVICIO</a>
                    <a href="#" className="text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors">DOCUMENTACIÓN API</a>
                </div>
            </footer>
        </div>
    );
};

export default HelpCenter;
