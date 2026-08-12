import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import logoEmplifi from '../../assets/images/logo_emplifi.png';
import DeveloperCard from '../../components/common/DeveloperCard';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('login'); // 'login' or 'forgotPassword'
    const [successMsg, setSuccessMsg] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const authErr = sessionStorage.getItem('auth_error_toast');
        if (authErr) {
            setError(authErr);
            sessionStorage.removeItem('auth_error_toast');
        }
    }, []);

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
                body: JSON.stringify({ email: email.trim(), password }),
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
            if (['admin', 'accounting', 'entrepreneur'].includes(data.data.role)) {
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

    const handleBiometricLogin = async () => {
        if (!email) {
            setError('Por favor, ingresa tu correo electrónico para usar biometría.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // 1. Obtener opciones de autenticación
            const optionsResponse = await fetch(`${API_BASE_URL}/biometric/login/options`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: email })
            });

            const optionsData = await optionsResponse.json();
            if (!optionsResponse.ok) throw new Error(optionsData.message || 'Error al obtener opciones');

            // 2. Iniciar autenticación en el navegador
            const { startAuthentication } = await import('@simplewebauthn/browser');

            // Separar metadatos internos de las opciones de WebAuthn
            const { internalUserId, ...webauthnOptions } = optionsData;
            const authResponse = await startAuthentication({ optionsJSON: webauthnOptions });

            // 3. Verificar en el servidor
            const verifyResponse = await fetch(`${API_BASE_URL}/biometric/login/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    body: authResponse,
                    internalUserId: optionsData.internalUserId
                })
            });

            const verifyData = await verifyResponse.json();

            // SECURITY CHECK: Server detected biometric change or credential expiry
            if (verifyData.requiresReRegistration) {
                setError(verifyData.message || 'Tu biometría ha cambiado o expiró. Inicia sesión con tu contraseña y vuelve a registrar tu huella en tu perfil.');
                setLoading(false);
                return;
            }

            if (!verifyResponse.ok || !verifyData.verified) {
                throw new Error(verifyData.message || 'La verificación biométrica falló');
            }

            // 4. Login exitoso
            onLogin({
                user: verifyData.data,
                token: verifyData.token,
            });
            localStorage.setItem('token', verifyData.token);

            if (['admin', 'accounting', 'entrepreneur'].includes(verifyData.data.role)) {
                navigate('/admin');
            } else {
                navigate('/empleado');
            }

        } catch (err) {
            console.error('Biometric Login Error:', err);
            let userMessage = err.message;

            if (err.name === 'NotAllowedError') {
                userMessage = 'Operación cancelada o tiempo agotado.';
            } else if (err.message.includes('404') || err.message.includes('no tiene biometría')) {
                userMessage = 'Este usuario no tiene una huella digital registrada aún.';
            } else if (err.message.includes('400') || err.message.includes('verificación')) {
                userMessage = 'No se pudo verificar su identidad. Inténtelo de nuevo.';
            }

            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!email) {
            setError('Por favor, ingresa tu correo electrónico.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al procesar la solicitud');

            setSuccessMsg(data.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const IconFingerprint = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10a4 4 0 0 0-4 4c0 1.03.13 2.15.4 3.19"></path><path d="M11 10a4 4 0 0 1 4 4c0 .49-.13.95-.34 1.35"></path><path d="M7 19c1.03 1.23 2.4 2 4 2 3.09 0 6-2.61 6-9a7 7 0 1 0-14 0c0 .99.13 1.94.39 2.85"></path><path d="M11 14a2 2 0 1 0 2 2"></path><path d="M11 2a11 11 0 0 0-11 11c0 1.93.41 3.76 1.15 5.4"></path><path d="M11 5a8 8 0 0 1 8 8c0 2.45-.64 4.74-1.74 6.7"></path></svg>
    );

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#f9fafb] text-[#374151] p-4 font-sans antialiased">
            <div className="w-full max-w-sm sm:max-w-md">
                {/* Logo y Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center mb-6"
                >
                    <img
                        src={logoEmplifi}
                        alt="EMPLIFI ERP"
                        className="h-9 w-auto object-contain mx-auto mb-3"
                    />
                    <h1 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
                        Acceso al Sistema ERP
                    </h1>
                    <p className="text-xs text-gray-500">
                        Ingrese sus credenciales de usuario para continuar
                    </p>
                </motion.div>

                {/* Card de Login */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="bg-white rounded border border-[#e5e7eb] p-6 sm:p-7 shadow-none"
                >
                    {view === 'login' ? (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Email */}
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">
                                    Correo Electrónico o Cédula
                                </label>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                        placeholder="usuario@empresa.com o Cédula"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-medium text-gray-700">
                                        Contraseña
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleBiometricLogin}
                                        className="text-[11px] font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 bg-white px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <IconFingerprint />
                                        <span>Biometría</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-9 pr-9 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                                    >
                                        {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Autenticando...
                                        </span>
                                    ) : (
                                        'Iniciar Sesión'
                                    )}
                                </button>
                            </div>

                            {/* Links */}
                            <div className="flex items-center justify-between pt-3.5 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                                >
                                    <FiArrowLeft className="w-3.5 h-3.5" />
                                    <span>Inicio</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setView('forgotPassword'); setError(''); setSuccessMsg(''); }}
                                    className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium cursor-pointer"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-4" onSubmit={handleForgotPassword}>
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-gray-900">Recuperar Acceso</h2>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Ingrese su correo electrónico registrado para recibir las instrucciones de restablecimiento.
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                                        placeholder="usuario@empresa.com"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                                    {error}
                                </div>
                            )}

                            {successMsg && (
                                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                                    {successMsg}
                                </div>
                            )}

                            <div className="space-y-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={loading || !!successMsg}
                                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? 'Enviando...' : successMsg ? 'Correo Enviado' : 'Enviar Instrucciones'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
                                    className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer"
                                >
                                    Volver al Login
                                </button>
                            </div>
                        </form>
                    )}
                </motion.section>
            </div>
            <DeveloperCard />
        </main>
    );
}

export default Login;
