

import { useNavigate } from 'react-router-dom';
import { FiUser, FiClock, FiCalendar, FiDollarSign, FiClipboard, FiTarget, FiHelpCircle } from 'react-icons/fi';

function EmployeeDashboard({ user, onLogout }) {
    const navigate = useNavigate();

    const actions = [
        { title: 'Mi Perfil', icon: <FiUser />, color: 'bg-blue-500', desc: 'Ver y editar información personal', path: '/profile' },
        { title: 'Asistencia', icon: <FiClock />, color: 'bg-purple-500', desc: 'Registrar entrada/salida y ver historial', path: '/empleado/asistencia' },
        { title: 'Permisos', icon: <FiCalendar />, color: 'bg-pink-500', desc: 'Solicitar ausencias y ver estado', path: '/empleado/ausencias' },
        { title: 'Mis Pagos', icon: <FiDollarSign />, color: 'bg-green-500', desc: 'Descargar recibos de nómina', path: '/my-payments' },
        { title: 'Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-500', desc: 'Realizar autoevaluaciones y ver resultados', path: '/performance/my-evaluations' },
        { title: 'Mis Objetivos', icon: <FiTarget />, color: 'bg-cyan-500', desc: 'Definir y seguir objetivos SMART', path: '/performance/goals' },
        { title: 'Ayuda / Manual', icon: <FiHelpCircle />, color: 'bg-amber-500', desc: 'Guías de uso y soporte técnico', path: '/help' },
    ]

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Navbar */}
            <nav className="bg-blue-950 text-white border-b border-white/10 sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold tracking-tight">
                                EMPLIFI
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/80">
                                Portal del Empleado
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/help')}
                                className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors"
                                title="Centro de Ayuda"
                            >
                                <FiHelpCircle size={20} />
                            </button>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-white">{user?.firstName || 'Empleado'}</p>
                                <p className="text-xs text-emerald-400">{user?.position || 'Colaborador'}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-200 hover:bg-red-500/20 transition-colors text-sm font-medium"
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
                    <h1 className="text-3xl font-bold mb-2 text-slate-800">
                        Hola, <span className="text-blue-900">{user?.firstName || 'Empleado'}</span>
                    </h1>
                    <p className="text-slate-500">
                        Bienvenido a tu portal personal. ¿Qué deseas hacer hoy?
                    </p>
                </section>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {actions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => action.path !== '#' && navigate(action.path)}
                            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1 text-left shadow-sm"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 ${action.color.replace('bg-', 'text-').replace('500', '100')} opacity-20 rounded-bl-full group-hover:scale-110 transition-transform bg-current`}></div>
                            <div className={`text-4xl mb-4 ${action.color.replace('bg-', 'text-').replace('500', '600')}`}>{action.icon}</div>
                            <h3 className="text-lg font-bold mb-1 text-slate-800">{action.title}</h3>
                            <p className="text-sm text-slate-500">{action.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Recent Activity / Notifications */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                            <span></span> Novedades - En Proceso
                        </h3>
                        <div className="space-y-4">
                            <div
                                onClick={() => navigate('/performance/my-evaluations')}
                                className="p-4 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <p className="text-sm font-medium text-blue-600 mb-1">Nueva Evaluación</p>
                                <p className="text-sm text-slate-600">Tienes una evaluación de desempeño pendiente por completar.</p>
                            </div>
                            <div
                                onClick={() => navigate('/my-payments')}
                                className="p-4 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <p className="text-sm font-medium text-emerald-600 mb-1">Pago Procesado</p>
                                <p className="text-sm text-slate-600">Tu nómina del mes ha sido depositada exitosamente.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                            <span></span> Próximos Eventos - En Proceso
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold border border-purple-100">
                                    15
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">Reunión de equipo</p>
                                    <p className="text-sm text-slate-500">10:00 AM - Sala Virtual</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                    20
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">Cierre de nómina</p>
                                    <p className="text-sm text-slate-500">Recuerda registrar tus horas</p>
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
