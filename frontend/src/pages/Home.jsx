import { Link } from 'react-router-dom'


function Home() {
    return (
        <main className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                EMPLIFI
                            </span>
                        </div>
                        <div>
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                            >
                                Iniciar Sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px]"></div>
                    <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8">
                        Gestión de RRHH <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            Simple e Inteligente
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        La plataforma todo en uno diseñada para pequeñas empresas. Automatiza nómina, asistencia y evaluaciones sin complicaciones.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/login"
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105"
                        >
                            Comenzar Ahora
                        </Link>
                        <button className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium">
                            Ver Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas</h2>
                        <p className="text-slate-400">Módulos integrados para una gestión completa</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Gestión de Empleados',
                                desc: 'Expedientes digitales, contratos y documentos centralizados.',
                                icon: '',
                                color: 'from-blue-500/20 to-blue-600/5'
                            },
                            {
                                title: 'Control de Asistencia',
                                desc: 'Registro de entradas, salidas y gestión de turnos simplificada.',
                                icon: '',
                                color: 'from-purple-500/20 to-purple-600/5'
                            },
                            {
                                title: 'Nómina Automática',
                                desc: 'Cálculo de sueldos, extras y generación de recibos en segundos.',
                                icon: '',
                                color: 'from-green-500/20 to-green-600/5'
                            },
                            {
                                title: 'Evaluación 360°',
                                desc: 'Mide el desempeño y detecta oportunidades de mejora.',
                                icon: '',
                                color: 'from-orange-500/20 to-orange-600/5'
                            },
                            {
                                title: 'Reclutamiento',
                                desc: 'Gestiona vacantes y candidatos desde un solo lugar.',
                                icon: '',
                                color: 'from-pink-500/20 to-pink-600/5'
                            },
                            {
                                title: 'Reportes Inteligentes',
                                desc: 'Toma decisiones basadas en datos con nuestro asistente IA.',
                                icon: '',
                                color: 'from-cyan-500/20 to-cyan-600/5'
                            }
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className={`p-6 rounded-2xl bg-gradient-to-br ${feature.color} border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1`}
                            >
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-slate-400 text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-white/5 text-center text-slate-500 text-sm">
                <p>© 2025 Emplifi. Todos los derechos reservados.</p>
            </footer>
        </main>
    )
}

export default Home
