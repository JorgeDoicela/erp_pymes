import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiUsers, FiClock, FiCalendar, FiDollarSign, FiGift,
    FiBriefcase, FiFileText, FiBarChart2,
    FiTrendingUp, FiCpu, FiArrowRight, FiCheckCircle,
    FiActivity, FiZap
} from 'react-icons/fi';
import logoEmplifi from '../../assets/images/logo_emplifi.png';
import DeveloperCard from '../../components/common/DeveloperCard';

function Home() {
    const modules = [
        {
            title: 'Empleados',
            desc: 'Gestión completa de expedientes digitales',
            icon: <FiUsers />,
        },
        {
            title: 'Asistencia',
            desc: 'Control de entradas y salidas',
            icon: <FiClock />,
        },
        {
            title: 'Turnos',
            desc: 'Programación de horarios',
            icon: <FiCalendar />,
        },
        {
            title: 'Ausencias',
            desc: 'Solicitudes y permisos',
            icon: <FiCheckCircle />,
        },
        {
            title: 'Nómina',
            desc: 'Cálculo automático de sueldos',
            icon: <FiDollarSign />,
        },
        {
            title: 'Beneficios',
            desc: 'Gestión de beneficios',
            icon: <FiGift />,
        },
        {
            title: 'Evaluaciones',
            desc: 'Evaluación 360° de desempeño',
            icon: <FiTrendingUp />,
        },
        {
            title: 'Reclutamiento',
            desc: 'Vacantes y candidatos',
            icon: <FiBriefcase />,
        },
        {
            title: 'Reportes',
            desc: 'Análisis y exportación',
            icon: <FiFileText />,
        },
        {
            title: 'Analíticas',
            desc: 'Métricas y estadísticas',
            icon: <FiBarChart2 />,
        }
    ];

    const features = [
        {
            icon: <FiZap />,
            title: 'Automatización Inteligente',
            desc: 'Reduce tareas manuales con flujos automatizados de nómina, asistencia y evaluaciones.'
        },
        {
            icon: <FiCpu />,
            title: 'Asistente Inteligente',
            desc: 'Dashboard predictivo con alertas proactivas y recomendaciones inteligentes.'
        },
        {
            icon: <FiActivity />,
            title: 'Análisis en Tiempo Real',
            desc: 'Métricas actualizadas y reportes personalizables para tomar mejores decisiones.'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <main className="min-h-screen bg-[#f9fafb] text-[#374151] font-sans antialiased">
            {/* Navbar */}
            <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="sticky top-0 z-50 bg-white border-b border-gray-200"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-3">
                            <img src={logoEmplifi} alt="EMPLIFI" className="h-8 w-auto object-contain" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="px-3.5 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                to="/register-company"
                                className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                            >
                                Crear Cuenta Empresa
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="py-16 lg:py-24 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-gray-100 border border-gray-200 text-gray-700 text-xs font-mono font-medium mb-6">
                            <FiCpu className="w-3.5 h-3.5 text-blue-600" />
                            <span>SaaS Multi-Empresa con Cumplimiento Legal Ecuador</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-5 tracking-tight leading-tight">
                            Gestión de RRHH, Nómina y Asistencia Simple e Inteligente
                        </h1>

                        {/* Subtitle */}
                        <p className="text-sm sm:text-base text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                            Plataforma completa para gestionar tu equipo. Automatiza nómina con asientos contables,
                            asistencia por GPS, finiquitos legales y analítica en tiempo real.
                        </p>

                        {/* CTA */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 w-full sm:w-auto">
                                <Link
                                    to="/register-company"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                                >
                                    Registrar Empresa (Prueba 45 Días)
                                    <FiArrowRight className="w-4 h-4" />
                                </Link>

                                <Link
                                    to="/login"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                                >
                                    Iniciar Sesión
                                </Link>
                            </div>

                            <Link
                                to="/careers"
                                className="text-gray-500 flex items-center gap-1.5 hover:text-blue-600 font-medium transition-colors text-xs mt-2"
                            >
                                <FiBriefcase className="w-3.5 h-3.5" />
                                Ver Vacantes Abiertas
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Highlight */}
            <section className="py-12 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.08 }}
                                className="bg-white border border-gray-200 rounded p-5 flex flex-col items-start"
                            >
                                <div className="p-2.5 rounded bg-gray-100 border border-gray-200 text-blue-600 mb-3">
                                    <span className="text-lg">{feature.icon}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                                    {feature.title}
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modules Section */}
            <section className="py-14 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <FiBriefcase className="text-gray-400" />
                                Aplicaciones y Módulos
                            </h2>
                            <p className="text-xl font-bold text-gray-900">
                                Todo lo que necesitas en un solo lugar
                            </p>
                        </div>
                        <span className="hidden sm:inline-block font-mono text-xs text-gray-500">
                            10 MÓDULOS INTEGRADOS
                        </span>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5"
                    >
                        {modules.map((mod, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="flex flex-col items-center justify-center p-4 bg-white rounded border border-gray-200 hover:border-blue-500 hover:bg-gray-50/60 transition-colors text-center group cursor-pointer"
                            >
                                <div className="p-2.5 rounded bg-gray-50 border border-gray-200 text-gray-700 group-hover:text-blue-600 group-hover:bg-blue-50/50 transition-colors mb-2.5 text-xl">
                                    {mod.icon}
                                </div>
                                <span className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {mod.title}
                                </span>
                                <span className="text-[11px] text-gray-500 mt-1 leading-tight">
                                    {mod.desc}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Intelligence Panel Highlight */}
            <section className="py-14 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded border border-gray-200 flex flex-col md:flex-row overflow-hidden">
                        <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/80 flex flex-col justify-center">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="p-2 bg-blue-50 border border-blue-200 text-blue-600 rounded">
                                    <FiActivity size={20} />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Panel Inteligente</h3>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                Dashboard inteligente que analiza tus datos y te proporciona alertas proactivas,
                                predicciones de rotación y recomendaciones predictivas.
                            </p>
                            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-blue-600">
                                <FiCpu className="w-3.5 h-3.5" />
                                <span>ANÁLISIS PREDICTIVO</span>
                            </div>
                        </div>

                        <div className="p-6 md:w-2/3 flex items-center justify-center">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                                <div className="flex items-start gap-3 p-3.5 rounded border border-gray-200 bg-white">
                                    <FiTrendingUp className="text-blue-600 mt-0.5 w-4 h-4 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 mb-0.5">
                                            Análisis Predictivo
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            Anticipa problemas de rotación
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3.5 rounded border border-gray-200 bg-white">
                                    <FiZap className="text-amber-600 mt-0.5 w-4 h-4 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 mb-0.5">
                                            Alertas Proactivas
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            Notificaciones inteligentes
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3.5 rounded border border-gray-200 bg-white">
                                    <FiBarChart2 className="text-emerald-600 mt-0.5 w-4 h-4 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 mb-0.5">
                                            Métricas Clave
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            KPIs en tiempo real
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3.5 rounded border border-gray-200 bg-white">
                                    <FiCheckCircle className="text-blue-600 mt-0.5 w-4 h-4 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 mb-0.5">
                                            Recomendaciones
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            Acciones sugeridas
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-16 bg-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Comienza a gestionar tu equipo de forma inteligente
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mb-6 max-w-xl mx-auto leading-relaxed">
                        Accede a todas las herramientas que necesitas para optimizar
                        la gestión de recursos humanos en tu empresa.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                    >
                        Iniciar Sesión
                        <FiArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            <DeveloperCard />
        </main>
    );
}

export default Home;
