

import { useNavigate } from 'react-router-dom';

function EmployeeDashboard({ user, onLogout }) {
    const navigate = useNavigate();

    const actions = [
        { title: 'Mi Perfil', icon: '', color: 'bg-blue-500', desc: 'Ver y editar información personal', path: '/profile' },
        { title: 'Asistencia', icon: '', color: 'bg-purple-500', desc: 'Registrar entrada/salida y ver historial', path: '/empleado/asistencia' },
        { title: 'Permisos', icon: '', color: 'bg-pink-500', desc: 'Solicitar ausencias y ver estado', path: '/empleado/ausencias' },
        { title: 'Mis Pagos', icon: '', color: 'bg-green-500', desc: 'Descargar recibos de nómina', path: '/my-payments' },
        { title: 'Evaluaciones', icon: '', color: 'bg-orange-500', desc: 'Realizar autoevaluaciones y ver resultados', path: '/performance/my-evaluations' },
        { title: 'Mis Objetivos', icon: '', color: 'bg-cyan-500', desc: 'Definir y seguir objetivos SMART', path: '/performance/goals' },
    ]

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Navbar */}
            <nav className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                EMPLIFI
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-white/10 text-slate-300">
                                Portal del Empleado
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-white">{user?.firstName || 'Empleado'}</p>
                                <p className="text-xs text-slate-400">{user?.position || 'Colaborador'}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <section className="mb-12 text-center sm:text-left">
                    <h1 className="text-3xl font-bold mb-2">
                        Hola, <span className="text-blue-400">{user?.firstName || 'Empleado'}</span>
                    </h1>
                    <p className="text-slate-400">
                        Bienvenido a tu portal personal. ¿Qué deseas hacer hoy?
                    </p>
                </section>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {actions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => action.path !== '#' && navigate(action.path)}
                            className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-white/5 p-6 hover:bg-slate-800 transition-all hover:-translate-y-1 text-left"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 ${action.color} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`}></div>
                            <div className="text-4xl mb-4">{action.icon}</div>
                            <h3 className="text-lg font-bold mb-1">{action.title}</h3>
                            <p className="text-sm text-slate-400">{action.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Recent Activity / Notifications */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span></span> Novedades - En Proceso
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-sm font-medium text-blue-300 mb-1">Nueva Evaluación</p>
                                <p className="text-sm text-slate-300">Tienes una evaluación de desempeño pendiente por completar.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-sm font-medium text-green-300 mb-1">Pago Procesado</p>
                                <p className="text-sm text-slate-300">Tu nómina del mes ha sido depositada exitosamente.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span></span> Próximos Eventos - En Proceso
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                                    15
                                </div>
                                <div>
                                    <p className="font-medium text-white">Reunión de equipo</p>
                                    <p className="text-sm text-slate-400">10:00 AM - Sala Virtual</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                    20
                                </div>
                                <div>
                                    <p className="font-medium text-white">Cierre de nómina</p>
                                    <p className="text-sm text-slate-400">Recuerda registrar tus horas</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default EmployeeDashboard
