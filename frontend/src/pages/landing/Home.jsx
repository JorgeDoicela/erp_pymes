import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiUsers, FiClock, FiCalendar, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2,
    FiTrendingUp, FiCpu, FiArrowRight, FiCheckCircle,
    FiActivity, FiZap
} from 'react-icons/fi';
import logoEmplifi from '../../assets/images/logo_emplifi.png';

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
            desc: 'Reduce tareas manuales con flujos automatizados de nómina, asistencia y evaluaciones'
        },
        {
            icon: <FiCpu />,
            title: 'Asistente Inteligente',
            desc: 'Dashboard predictivo con alertas proactivas y recomendaciones basadas en heurística'
        },
        {
            icon: <FiActivity />,
            title: 'Análisis en Tiempo Real',
            desc: 'Métricas actualizadas y reportes personalizables para tomar mejores decisiones'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <main className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <img src={logoEmplifi} alt="EMPLIFI" className="h-10 w-auto object-contain" />
                        </div>
                        <Link
                            to="/login"
                            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-100 mb-6">
                            <FiCpu className="w-4 h-4" />
                            <span className="text-sm font-medium">Asistente Inteligente con Análisis Predictivo</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl lg:text-6xl font-bold text-slate-800 mb-6 tracking-tight">
                            Gestión de RRHH Simple e Inteligente
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg lg:text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Plataforma completa para gestionar tu equipo. Automatiza procesos,
                            analiza datos y toma mejores decisiones con el asistente inteligente. 
                        </p>

                        {/* CTA */}
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold shadow-lg shadow-blue-200 transition-all"
                        >
                            Comenzar Ahora
                            <FiArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Features Highlight */}
            <section className="py-16 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex flex-col items-center text-center"
                            >
                                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mb-4">
                                    <span className="text-2xl">{feature.icon}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modules Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <FiBriefcase className="text-slate-400" />
                            Aplicaciones y Módulos
                        </h2>
                        <p className="text-2xl font-bold text-slate-800">
                            Todo lo que necesitas en un solo lugar
                        </p>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
                    >
                        {modules.map((mod, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all duration-200 group h-40 text-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="p-3 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-3 relative z-10 duration-200">
                                    <span className="text-2xl">{mod.icon}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 relative z-10">
                                    {mod.title}
                                </span>
                                <span className="text-xs text-slate-500 mt-1 relative z-10">
                                    {mod.desc}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Intelligence Panel Highlight */}
            <section className="py-16 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
                        <div className="p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FiActivity size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Panel Inteligente</h3>
                            </div>
                            <p className="text-slate-600 mb-4 leading-relaxed">
                                Dashboard inteligente que analiza tus datos y te proporciona alertas proactivas,
                                predicciones de rotación y recomendaciones basadas en heurística.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                                <FiCpu />
                                <span>Análisis Predictivo</span>
                            </div>
                        </div>

                        <div className="p-8 md:w-2/3 flex items-center justify-center">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                    <FiTrendingUp className="text-blue-600 mt-1" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 mb-1">
                                            Análisis Predictivo
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Anticipa problemas de rotación
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                    <FiZap className="text-amber-500 mt-1" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 mb-1">
                                            Alertas Proactivas
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Notificaciones inteligentes
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                    <FiBarChart2 className="text-emerald-500 mt-1" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 mb-1">
                                            Métricas Clave
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            KPIs en tiempo real
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                    <FiCheckCircle className="text-blue-600 mt-1" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 mb-1">
                                            Recomendaciones
                                        </p>
                                        <p className="text-xs text-slate-500">
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
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-6">
                        Comienza a gestionar tu equipo de forma inteligente
                    </h2>
                    <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                        Accede a todas las herramientas que necesitas para optimizar
                        la gestión de recursos humanos en tu empresa
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold shadow-lg shadow-blue-200 transition-all"
                    >
                        Iniciar Sesión
                        <FiArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-white border-t border-slate-200">
            </footer>
        </main>
    );
}

export default Home;
