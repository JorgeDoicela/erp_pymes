import { useState } from 'react'
import { useNavigate } from 'react-router-dom'


const API_BASE_URL = 'http://localhost:4000'

function Login({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        if (!email || !password) {
            setError('Por favor completa todos los campos.')
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Error al iniciar sesión')
            }

            onLogin({
                user: data.data,
                token: data.token,
            })

            // Save token to localStorage for axios interceptor
            localStorage.setItem('token', data.token);

            // Redirección automática basada en el rol
            if (data.data.role === 'admin') {
                navigate('/admin')
            } else {
                navigate('/empleado')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-blue-500/10 blur-[100px]"></div>
                <div className="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-[100px]"></div>
            </div>

            <section className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                        EMPLIFI
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Gestión inteligente de recursos humanos
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
                            placeholder="nombre@empresa.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Ingresando...
                                </span>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            ← Volver al inicio
                        </button>
                        <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>
                </form>
            </section>
        </main>
    )
}

export default Login
