

function AdminDashboard({ user, onLogout }) {
    const modules = [
        { title: 'Empleados', icon: '', color: 'bg-blue-500', path: '/employees' },
        { title: 'Asistencia', icon: '', color: 'bg-purple-500', path: '/attendance' },
        { title: 'Nómina', icon: '', color: 'bg-green-500', path: '/payroll' },
        { title: 'Evaluaciones', icon: '', color: 'bg-orange-500', path: '/performance' },
        { title: 'Reclutamiento', icon: '', color: 'bg-pink-500', path: '/recruitment' },
        { title: 'Reportes', icon: '', color: 'bg-cyan-500', path: '/reports' },
    ]

    const insights = [
        { type: 'warning', message: '3 contratos vencen esta semana', icon: '' },
        { type: 'info', message: 'Ausentismo aumentó un 5% este mes', icon: '' },
        { type: 'success', message: 'Nómina procesada correctamente', icon: '' },
    ]

    return (
        <div className="min-h-screen bg-slate-900 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-white/10 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        EMPLIFI
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Menu Principal
                    </div>
                    {modules.map((mod, idx) => (
                        <button
                            key={idx}
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left"
                        >
                            <span>{mod.icon}</span>
                            <span>{mod.title}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                            {user?.firstName?.[0] || 'A'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{user?.firstName || 'Admin'}</p>
                            <p className="text-xs text-slate-400">Administrador</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="text-xl font-semibold">Panel de Control</h2>
                    <div className="md:hidden">
                        {/* Mobile menu button placeholder */}
                        <button className="text-slate-400">☰</button>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Intelligent Assistant Section */}
                    <section className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]"></div>

                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-yellow-400"></span> Asistente Inteligente
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {insights.map((insight, idx) => (
                                    <div key={idx} className="bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex items-start gap-3">
                                        <span className="text-2xl">{insight.icon}</span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{insight.message}</p>
                                            <button className="text-xs text-blue-400 mt-2 hover:text-blue-300">
                                                Ver detalles →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Modules Grid */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 text-slate-300">Accesos Directos</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {modules.map((mod, idx) => (
                                <button
                                    key={idx}
                                    className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-white/5 p-6 hover:bg-slate-800 transition-all hover:-translate-y-1 text-left"
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 ${mod.color} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`}></div>
                                    <div className="text-4xl mb-4">{mod.icon}</div>
                                    <h4 className="text-xl font-bold mb-1">{mod.title}</h4>
                                    <p className="text-sm text-slate-400">Gestionar {mod.title.toLowerCase()}</p>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default AdminDashboard
