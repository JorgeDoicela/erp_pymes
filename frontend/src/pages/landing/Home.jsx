import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiArrowRight } from 'react-icons/fi';
import logoEmplifi from '../../assets/images/logo_emplifi.png';
import DeveloperCard from '../../components/common/DeveloperCard';

function Home() {
    // Calculadora rápida de nómina en vivo para PyMEs (Ecuador)
    const [payrollSalary, setPayrollSalary] = useState(850);
    const [payrollDays, setPayrollDays] = useState(30);
    const [payrollOvertime50, setPayrollOvertime50] = useState(4);
    const [payrollOvertime100, setPayrollOvertime100] = useState(2);
    const [payrollAdvance, setPayrollAdvance] = useState(0);

    // Estado para FAQ interactivo
    const [openFaq, setOpenFaq] = useState(null);

    // Cálculo reactivo de Nómina en vivo (Fórmulas oficiales Ecuador)
    const payrollCalc = useMemo(() => {
        const base = Number(payrollSalary) || 0;
        const days = Math.min(30, Math.max(1, Number(payrollDays) || 30));
        const dailyRate = base / 30;
        const hourlyRate = base / 240;

        const earnedSalary = dailyRate * days;
        const overtime50Amount = (Number(payrollOvertime50) || 0) * hourlyRate * 1.5;
        const overtime100Amount = (Number(payrollOvertime100) || 0) * hourlyRate * 2.0;
        const totalEarnings = earnedSalary + overtime50Amount + overtime100Amount;

        const iessPersonal = totalEarnings * 0.0945;
        const iessPatronal = totalEarnings * 0.1115;
        const thirteenthMonthly = totalEarnings / 12;
        const fourteenthMonthly = 460 / 12;

        const totalDeductions = iessPersonal + (Number(payrollAdvance) || 0);
        const netSalary = Math.max(0, totalEarnings - totalDeductions);

        return {
            earnedSalary: earnedSalary.toFixed(2),
            overtime50Amount: overtime50Amount.toFixed(2),
            overtime100Amount: overtime100Amount.toFixed(2),
            totalEarnings: totalEarnings.toFixed(2),
            iessPersonal: iessPersonal.toFixed(2),
            iessPatronal: iessPatronal.toFixed(2),
            thirteenthMonthly: thirteenthMonthly.toFixed(2),
            fourteenthMonthly: fourteenthMonthly.toFixed(2),
            netSalary: netSalary.toFixed(2)
        };
    }, [payrollSalary, payrollDays, payrollOvertime50, payrollOvertime100, payrollAdvance]);

    // Planes de precios transparentes
    const pricingPlans = [
        {
            name: 'Essential',
            price: '$0.50',
            unit: 'USD / empleado / mes',
            limit: 'Hasta 25 colaboradores',
            badge: 'MICROEMPRESAS',
            isPopular: false,
            features: [
                'Expediente digital de colaboradores',
                'Marcación de asistencia GPS con geocerca',
                'Nómina legal según Código del Trabajo',
                'Horas extra 50% y 100%',
                'Simulador de finiquitos y liquidaciones',
                '45 días de prueba completa sin costo'
            ]
        },
        {
            name: 'Growth',
            price: '$1.00',
            unit: 'USD / empleado / mes',
            limit: 'Hasta 100 colaboradores',
            badge: 'MÁS POPULAR',
            isPopular: true,
            features: [
                'Todo lo incluido en Essential',
                'Portal del colaborador en móvil (PWA)',
                'Evaluaciones de desempeño y metas',
                'Portal público de vacantes (/careers)',
                'Contabilidad básica de nómina y asientos',
                'Soporte técnico prioritario'
            ]
        },
        {
            name: 'Enterprise',
            price: '$2.00',
            unit: 'USD / empleado / mes',
            limit: 'Colaboradores ilimitados',
            badge: 'EMPRESAS MEDIANAS',
            isPopular: false,
            features: [
                'Todo lo incluido en Growth',
                'Centros de costos y reportes avanzados',
                'Autenticación biométrica WebAuthn',
                'Alertas de retención y control de rotación',
                'Acompañamiento y migración guiada',
                'SLA y atención directa'
            ]
        }
    ];

    const faqs = [
        {
            q: '¿Cómo garantiza Emplifi el cumplimiento legal en Ecuador?',
            a: 'Emplifi incorpora directamente la normativa laboral ecuatoriana: cálculo automático de aportes al IESS (9.45% personal y 11.15% patronal), horas suplementarias (50%), extraordinarias (100%), decimotercero, decimocuarto, fondos de reserva y actas de finiquito (Arts. 185 y 188).'
        },
        {
            q: '¿Cómo funciona la prueba gratuita de 45 días?',
            a: 'Al registrar tu empresa recibes acceso completo a todos los módulos por 45 días continuos. No requieres ingresar tarjeta de crédito, lo que te permite procesar un ciclo completo de nómina y asistencia sin compromiso.'
        },
        {
            q: '¿Los colaboradores pueden marcar asistencia desde sus celulares?',
            a: 'Sí. Los colaboradores acceden al portal móvil sin descargas pesadas. El sistema valida su ubicación mediante geocerca GPS para registrar entradas, salidas y atrasos con total precisión.'
        },
        {
            q: '¿Cómo se protege la información salarial de mi empresa?',
            a: 'Cada empresa cuenta con una base de datos aislada con cifrado bancario AES-256-GCM. Cumplimos con la Ley Orgánica de Protección de Datos Personales (LOPDP), asegurando total confidencialidad.'
        }
    ];

    return (
        <main className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans antialiased selection:bg-blue-600 selection:text-white">
            {/* 1. Header / Barra de Navegación */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 sm:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Marca */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center">
                                <img src={logoEmplifi} alt="Emplifi ERP" className="h-7 w-auto object-contain" />
                            </Link>
                        </div>

                        {/* Menú de Navegación */}
                        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-gray-600">
                            <a href="#funciones" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
                            <a href="#simulador" className="hover:text-blue-600 transition-colors">Simulador de Nómina</a>
                            <a href="#precios" className="hover:text-blue-600 transition-colors">Planes y Precios</a>
                            <a href="#faq" className="hover:text-blue-600 transition-colors">Preguntas</a>
                        </nav>

                        {/* Acciones */}
                        <div className="flex items-center gap-3">
                            <Link
                                to="/careers"
                                className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                            >
                                Vacantes
                            </Link>
                            <Link
                                to="/login"
                                className="px-3.5 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                to="/register-company"
                                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-xs"
                            >
                                <span>Probar Gratis</span>
                                <FiChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Hero Section Espaciosa */}
            <section className="pt-20 pb-18 sm:pt-28 sm:pb-24 bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.12] mb-6">
                        Todo el control de tu personal y nómina en un solo lugar
                    </h1>

                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
                        Automatiza roles de pago con el Código del Trabajo y aportes IESS, controla asistencia con geocerca GPS y gestiona expedientes de tus colaboradores. Diseñado para pequeñas y medianas empresas en Ecuador.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Link
                            to="/register-company"
                            className="w-full sm:w-auto px-7 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
                        >
                            <span>Comenzar Prueba de 45 Días Gratis</span>
                            <FiArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                            href="#simulador"
                            className="w-full sm:w-auto px-6 py-3 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors inline-flex items-center justify-center"
                        >
                            Ver Calculadora de Nómina
                        </a>
                    </div>

                    {/* Resumen en texto corrido desahogado */}
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-gray-500 font-mono pt-6 border-t border-gray-100 max-w-3xl mx-auto">
                        <span>Normativa Ecuador & IESS</span>
                        <span className="text-gray-300">·</span>
                        <span>Asistencia GPS Verificada</span>
                        <span className="text-gray-300">·</span>
                        <span>Cifrado AES-256 & LOPDP</span>
                        <span className="text-gray-300">·</span>
                        <span>45 Días sin Tarjeta</span>
                    </div>
                </div>
            </section>

            {/* 3. Vista Operativa del Software (Mock Estilo Linear/Holded) */}
            <section className="py-16 sm:py-24 bg-gray-50 border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 sm:px-8">
                    <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-xs">
                        {/* Barra superior de ventana */}
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between font-mono text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                <span className="ml-2 text-gray-500 text-[11px]">panel.emplifi.ec · Centro de Control</span>
                            </div>
                            <span className="text-[11px] font-medium text-gray-600 font-mono">
                                Estado: Nómina al día
                            </span>
                        </div>

                        {/* Vista de datos operativos con espacio amplio */}
                        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Tabla de Asistencia */}
                            <div className="lg:col-span-8 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-mono">
                                            Asistencia del Día
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">Marcaciones en sede validadas por ubicación GPS</p>
                                    </div>
                                    <span className="text-xs font-mono font-medium text-gray-600">
                                        12 / 12 Presentes
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead>
                                            <tr className="border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                                <th className="py-2 px-3 font-medium">Colaborador</th>
                                                <th className="py-2 px-3 font-medium">Cargo</th>
                                                <th className="py-2 px-3 font-medium">Ingreso</th>
                                                <th className="py-2 px-3 font-medium">Ubicación</th>
                                                <th className="py-2 px-3 font-medium text-right">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-xs">
                                            <tr>
                                                <td className="py-3 px-3 font-semibold text-gray-900">Carlos Méndez</td>
                                                <td className="py-3 px-3 text-gray-600">Supervisor de Planta</td>
                                                <td className="py-3 px-3 text-gray-600">08:00 AM</td>
                                                <td className="py-3 px-3 text-gray-600">Sede Principal (42m)</td>
                                                <td className="py-3 px-3 text-right text-gray-700 font-medium">
                                                    Puntual
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 px-3 font-semibold text-gray-900">Elena Salgado</td>
                                                <td className="py-3 px-3 text-gray-600">Contadora General</td>
                                                <td className="py-3 px-3 text-gray-600">08:02 AM</td>
                                                <td className="py-3 px-3 text-gray-600">Sede Principal (18m)</td>
                                                <td className="py-3 px-3 text-right text-gray-700 font-medium">
                                                    Puntual
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 px-3 font-semibold text-gray-900">David Vaca</td>
                                                <td className="py-3 px-3 text-gray-600">Técnico de Campo</td>
                                                <td className="py-3 px-3 text-gray-600">08:14 AM</td>
                                                <td className="py-3 px-3 text-gray-600">Sucursal Norte (95m)</td>
                                                <td className="py-3 px-3 text-right text-gray-700 font-medium">
                                                    Tolerancia (14m)
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Resumen Financiero */}
                            <div className="lg:col-span-4 bg-gray-50 rounded border border-gray-200 p-5 font-mono text-xs flex flex-col justify-between space-y-6">
                                <div>
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                                        <span className="text-xs font-semibold text-gray-900 uppercase">Resumen de Nómina</span>
                                        <span className="text-[10px] text-gray-500">MES ACTUAL</span>
                                    </div>
                                    <div className="space-y-2.5 text-xs">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Masa Salarial:</span>
                                            <span className="text-gray-900 font-semibold tabular-nums">$9,850.00</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Horas Extraordinarias:</span>
                                            <span className="text-gray-900 tabular-nums">$412.50</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Aporte Personal IESS:</span>
                                            <span className="text-red-600 tabular-nums">-$969.80</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Aporte Patronal (11.15%):</span>
                                            <span className="text-gray-900 tabular-nums">$1,144.27</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-900">Total Líquido:</span>
                                    <span className="text-blue-600 font-bold tabular-nums text-sm">$9,292.70 USD</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Funcionalidades Principales para PyMEs */}
            <section id="funciones" className="py-20 sm:py-28 bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 sm:px-8">
                    <div className="max-w-2xl mx-auto text-center mb-14">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                            FUNCIONALIDADES CLAVE
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                            Diseñado para resolver el día a día de tu negocio
                        </h2>
                        <p className="text-sm text-gray-600 mt-3">
                            Olvídate de las hojas de Excel desactualizadas y los errores en el pago de sueldos o aportes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 rounded bg-white border border-gray-200 flex flex-col justify-between space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide font-mono mb-2">
                                    Nómina Legal & IESS
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Cálculo automático de sueldos, horas extra al 50% y 100%, recargo nocturno, décimos y retenciones IESS.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-500">
                                Fórmulas oficiales Ecuador
                            </div>
                        </div>

                        <div className="p-6 rounded bg-white border border-gray-200 flex flex-col justify-between space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide font-mono mb-2">
                                    Asistencia GPS & Turnos
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Tus colaboradores marcan desde el móvil con geocerca GPS. Control de atrasos, permisos y descansos.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-500">
                                Marcación en 1 toque
                            </div>
                        </div>

                        <div className="p-6 rounded bg-white border border-gray-200 flex flex-col justify-between space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide font-mono mb-2">
                                    Expediente Digital
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Historial laboral completo, contratos por vencer, activos asignados, certificados y documentos en orden.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-500">
                                Todo centralizado
                            </div>
                        </div>

                        <div className="p-6 rounded bg-white border border-gray-200 flex flex-col justify-between space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide font-mono mb-2">
                                    Finiquitos & Actas
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Genera actas de liquidación al instante según los Arts. 185 (desahucio) y 188 (despido) sin riesgo legal.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-500">
                                Apegado a la Ley
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Simulador Rápido de Rol de Pago */}
            <section id="simulador" className="py-20 sm:py-28 bg-gray-50 border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 sm:px-8">
                    <div className="max-w-2xl mx-auto text-center mb-12">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                            TRANSPARENCIA DE CÁLCULO
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                            Calculadora de Nómina en Tiempo Real
                        </h2>
                        <p className="text-sm text-gray-600 mt-3">
                            Prueba las fórmulas oficiales de nómina ecuatoriana y observa el desglose exacto de un colaborador.
                        </p>
                    </div>

                    <div className="bg-white rounded border border-gray-200 p-6 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Parámetros */}
                        <div className="lg:col-span-6 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-mono">
                                    Parámetros del Colaborador
                                </h3>
                                <span className="text-[10px] font-mono text-gray-500">SBU: $460.00</span>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Salario Base Mensual (USD):
                                </label>
                                <input
                                    type="number"
                                    min="460"
                                    max="5000"
                                    step="50"
                                    value={payrollSalary}
                                    onChange={(e) => setPayrollSalary(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-700 mb-1.5">
                                        Días Laborados:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={payrollDays}
                                        onChange={(e) => setPayrollDays(e.target.value)}
                                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-700 mb-1.5">
                                        Anticipo Quincenal ($):
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1000"
                                        step="25"
                                        value={payrollAdvance}
                                        onChange={(e) => setPayrollAdvance(e.target.value)}
                                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-medium text-gray-700 mb-1.5">
                                        Horas Extra 50%:
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="40"
                                        value={payrollOvertime50}
                                        onChange={(e) => setPayrollOvertime50(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-gray-700 mb-1.5">
                                        Horas Extra 100%:
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="40"
                                        value={payrollOvertime100}
                                        onChange={(e) => setPayrollOvertime100(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Desglose */}
                        <div className="lg:col-span-6 bg-gray-50 rounded border border-gray-200 p-5 sm:p-6 font-mono text-xs flex flex-col justify-between space-y-6">
                            <div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                                    <span className="text-xs font-semibold text-gray-900 uppercase">Rol de Pago Individual</span>
                                    <span className="text-[10px] font-mono text-gray-500">
                                        Normativa IESS
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between text-gray-600">
                                        <span>(+) Sueldo ganado ({payrollDays}d):</span>
                                        <span className="text-gray-900 font-semibold tabular-nums">${payrollCalc.earnedSalary}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>(+) Horas Suplementarias (50%):</span>
                                        <span className="text-gray-900 tabular-nums">${payrollCalc.overtime50Amount}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>(+) Horas Extraordinarias (100%):</span>
                                        <span className="text-gray-900 tabular-nums">${payrollCalc.overtime100Amount}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200 text-gray-800 font-medium">
                                        <span>Total Ingresos Imponibles:</span>
                                        <span className="tabular-nums">${payrollCalc.totalEarnings}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 pt-1">
                                        <span>(-) Aporte Personal IESS (9.45%):</span>
                                        <span className="tabular-nums">-${payrollCalc.iessPersonal}</span>
                                    </div>
                                    {Number(payrollAdvance) > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>(-) Anticipo Descontado:</span>
                                            <span className="tabular-nums">-${Number(payrollAdvance).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t-2 border-gray-200">
                                <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                                    <span>LÍQUIDO A PAGAR:</span>
                                    <span className="text-blue-600 text-base font-mono tabular-nums">
                                        ${payrollCalc.netSalary} USD
                                    </span>
                                </div>
                                <div className="mt-3 text-[10px] text-gray-500 flex justify-between pt-2 border-t border-gray-100">
                                    <span>Patronal (11.15%): ${payrollCalc.iessPatronal}</span>
                                    <span>13ro: ${payrollCalc.thirteenthMonthly}</span>
                                    <span>14to: ${payrollCalc.fourteenthMonthly}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Planes y Tarifas Transparentes */}
            <section id="precios" className="py-20 sm:py-28 bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 sm:px-8">
                    <div className="max-w-2xl mx-auto text-center mb-14">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                            TARIFAS TRANSPARENTES
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                            Precios claros y sin sorpresas
                        </h2>
                        <p className="text-sm text-gray-600 mt-3">
                            Paga únicamente por los colaboradores activos que gestionas cada mes. Incluye 45 días de prueba completa.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {pricingPlans.map((plan, idx) => (
                            <div
                                key={idx}
                                className={`rounded border p-7 sm:p-8 flex flex-col justify-between bg-white relative space-y-6 ${
                                    plan.isPopular ? 'border-blue-600 ring-1 ring-blue-600 shadow-xs' : 'border-gray-200'
                                }`}
                            >
                                <div>
                                    <div className="mb-6">
                                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                                            {plan.badge}
                                        </span>
                                        <h3 className="text-xl font-bold text-gray-900 mt-1">{plan.name}</h3>
                                        <div className="mt-4 flex items-baseline gap-1">
                                            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-gray-900">{plan.price}</span>
                                            <span className="text-xs font-mono text-gray-500">{plan.unit}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1.5 font-mono">{plan.limit}</p>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 space-y-2.5 text-xs text-gray-600">
                                        {plan.features.map((feat, fIdx) => (
                                            <div key={fIdx} className="flex items-start gap-2.5">
                                                <span className="text-gray-400 font-mono">·</span>
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Link
                                    to="/register-company"
                                    className={`w-full py-2.5 rounded text-xs font-medium text-center transition-colors block ${
                                        plan.isPopular
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    Comenzar Prueba Gratuita
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Preguntas Frecuentes (FAQ) */}
            <section id="faq" className="py-20 sm:py-28 bg-gray-50 border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-6 sm:px-8">
                    <div className="text-center mb-12">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-gray-500">
                            DUDAS FRECUENTES
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                            Preguntas Frecuentes
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded border border-gray-200 overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-6 py-4.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <span>{faq.q}</span>
                                    <FiChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                                        openFaq === idx ? 'rotate-90' : ''
                                    }`} />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-6 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. CTA Final */}
            <section className="py-20 sm:py-26 bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                        Comienza a gestionar tu personal de forma profesional
                    </h2>
                    <p className="text-sm text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
                        Crea tu empresa en minutos y disfruta de 45 días de prueba completa con todas las funcionalidades activas.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/register-company"
                            className="w-full sm:w-auto px-7 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"
                        >
                            Crear Empresa (45 Días Gratis)
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-7 py-3 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                        >
                            Acceder al Sistema
                        </Link>
                    </div>
                </div>
            </section>

            {/* 9. Footer Institucional */}
            <footer className="bg-gray-50 text-gray-600 text-xs border-t border-gray-200 py-14 sm:py-16">
                <div className="max-w-6xl mx-auto px-6 sm:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10 pb-10 border-b border-gray-200">
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <img src={logoEmplifi} alt="Emplifi" className="h-6 w-auto object-contain" />
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Software ERP de Gestión del Talento Humano y Nómina Legal para pequeñas y medianas empresas en Ecuador.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider font-mono mb-4">Módulos</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><a href="#funciones" className="hover:text-blue-600 transition-colors">Nómina & Roles</a></li>
                                <li><a href="#funciones" className="hover:text-blue-600 transition-colors">Marcación GPS</a></li>
                                <li><a href="#funciones" className="hover:text-blue-600 transition-colors">Expedientes Digitales</a></li>
                                <li><a href="#funciones" className="hover:text-blue-600 transition-colors">Finiquitos & Actas</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider font-mono mb-4">Empresa</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><Link to="/careers" className="hover:text-blue-600 transition-colors">Bolsa de Empleo</Link></li>
                                <li><a href="#precios" className="hover:text-blue-600 transition-colors">Planes y Precios</a></li>
                                <li><Link to="/investigacion" className="hover:text-blue-600 transition-colors">Investigación PyMEs</Link></li>
                                <li><a href="#faq" className="hover:text-blue-600 transition-colors">Preguntas Frecuentes</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider font-mono mb-4">Acceso Rápido</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><Link to="/login" className="hover:text-blue-600 transition-colors">Iniciar Sesión</Link></li>
                                <li><Link to="/register-company" className="hover:text-blue-600 transition-colors">Registrar Empresa</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-gray-500">
                        <div>
                            © 2026 Jorge Doicela. Todos los derechos reservados.
                        </div>
                        <div className="flex items-center gap-4">
                            <span>SaaS ERP Ecuador</span>
                            <span className="text-gray-300">|</span>
                            <span>Cifrado AES-256</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Tarjeta Flotante del Desarrollador */}
            <DeveloperCard />
        </main>
    );
}

export default Home;
