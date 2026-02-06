import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import logoEmplifi from '../../assets/images/logo_emplifi.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Por favor completa todos los campos.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }

            onLogin({
                user: data.data,
                token: data.token,
            });

            // Save token to localStorage for axios interceptor
            localStorage.setItem('token', data.token);

            // Redirección automática basada en el rol
            if (data.data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/empleado');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo y Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <img
                        src={logoEmplifi}
                        alt="EMPLIFI"
                        className="h-12 w-auto object-contain mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">
                        Bienvenido de nuevo
                    </h1>
                    <p className="text-slate-600 text-sm">
                        Ingresa tus credenciales para continuar
                    </p>
                </motion.div>

                {/* Card de Login */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-8"
                >
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all"
                                    placeholder="nombre@empresa.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Contraseña
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

                        {/* Links */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <FiArrowLeft className="w-4 h-4" />
                                Volver al inicio
                            </button>
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </form>
                </motion.section>
            </div>
        </main>
    );
}

export default Login;
