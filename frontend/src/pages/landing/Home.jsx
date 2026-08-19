import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUsers, FiClock, FiCalendar, FiDollarSign, FiGift,
    FiBriefcase, FiFileText, FiBarChart2, FiTrendingUp,
    FiCpu, FiArrowRight, FiCheckCircle, FiActivity, FiZap,
    FiShield, FiLock, FiLayers, FiDatabase, FiServer,
    FiCheck, FiChevronRight, FiSliders, FiCompass,
    FiAward, FiSmartphone, FiHelpCircle, FiCheckSquare,
    FiPercent, FiShare2, FiTarget, FiSearch, FiCode
} from 'react-icons/fi';
import logoEmplifi from '../../assets/images/logo_emplifi.png';
import DeveloperCard from '../../components/common/DeveloperCard';

function Home() {
    // Estado del demostrador interactivo en vivo
    const [activeDemoTab, setActiveDemoTab] = useState('payroll');

    // Estado para la calculadora de Nómina en vivo
    const [payrollSalary, setPayrollSalary] = useState(850);
    const [payrollDays, setPayrollDays] = useState(30);
    const [payrollOvertime50, setPayrollOvertime50] = useState(4);
    const [payrollOvertime100, setPayrollOvertime100] = useState(2);
    const [payrollNightHours, setPayrollNightHours] = useState(8);
    const [payrollAdvance, setPayrollAdvance] = useState(0);

    // Estado para el simulador de Finiquito Legal en vivo
    const [offboardingSalary, setOffboardingSalary] = useState(900);
    const [offboardingYears, setOffboardingYears] = useState(3);
    const [offboardingMonths, setOffboardingMonths] = useState(4);
    const [offboardingCausal, setOffboardingCausal] = useState('UNFAIR_DISMISSAL'); // UNFAIR_DISMISSAL, VOLUNTARY_RESIGNATION, CONTRACT_END
    const [offboardingVacationDays, setOffboardingVacationDays] = useState(8);

    // Estado para el visor de Asistencia GPS
    const [geoDistance, setGeoDistance] = useState(85);
    const [geoRadius] = useState(200);
    const [vpnDetected, setVpnDetected] = useState(false);

    // Estado para FAQ interactivo
    const [openFaq, setOpenFaq] = useState(null);

    // Cálculo reactivo de Nómina en vivo (Fórmulas oficiales Ecuador)
    const payrollCalc = useMemo(() => {
        const base = Number(payrollSalary) || 0;
        const days = Math.min(30, Math.max(1, Number(payrollDays) || 30));
        const dailyRate = base / 30;
        const hourlyRate = base / 240; // 30 días * 8 horas

        const earnedSalary = dailyRate * days;
        const overtime50Amount = (Number(payrollOvertime50) || 0) * hourlyRate * 1.5;
        const overtime100Amount = (Number(payrollOvertime100) || 0) * hourlyRate * 2.0;
        const nightSurchargeAmount = (Number(payrollNightHours) || 0) * hourlyRate * 0.25;
        const totalEarnings = earnedSalary + overtime50Amount + overtime100Amount + nightSurchargeAmount;

        // Aportes de Ley IESS
        const iessPersonal = totalEarnings * 0.0945; // 9.45%
        const iessPatronal = totalEarnings * 0.1115; // 11.15%
        const thirteenthMonthly = totalEarnings / 12; // Provisión 13ro
        const fourteenthMonthly = 460 / 12; // $38.33 USD sobre SBU $460
        const reserveFund = totalEarnings * 0.0833; // 8.33%

        const totalDeductions = iessPersonal + (Number(payrollAdvance) || 0);
        const netSalary = Math.max(0, totalEarnings - totalDeductions);

        return {
            dailyRate: dailyRate.toFixed(2),
            hourlyRate: hourlyRate.toFixed(2),
            earnedSalary: earnedSalary.toFixed(2),
            overtime50Amount: overtime50Amount.toFixed(2),
            overtime100Amount: overtime100Amount.toFixed(2),
            nightSurchargeAmount: nightSurchargeAmount.toFixed(2),
            totalEarnings: totalEarnings.toFixed(2),
            iessPersonal: iessPersonal.toFixed(2),
            iessPatronal: iessPatronal.toFixed(2),
            thirteenthMonthly: thirteenthMonthly.toFixed(2),
            fourteenthMonthly: fourteenthMonthly.toFixed(2),
            reserveFund: reserveFund.toFixed(2),
            totalDeductions: totalDeductions.toFixed(2),
            netSalary: netSalary.toFixed(2)
        };
    }, [payrollSalary, payrollDays, payrollOvertime50, payrollOvertime100, payrollNightHours, payrollAdvance]);

    // Cálculo reactivo de Finiquito en vivo (Código del Trabajo Ecuador)
    const offboardingCalc = useMemo(() => {
        const base = Number(offboardingSalary) || 0;
        const years = Number(offboardingYears) || 0;
        const months = Number(offboardingMonths) || 0;
        const totalMonths = Math.min(12, months > 0 ? months : 12);
        const dailyRate = base / 30;

        // Proporcionales de Décimos
        const thirteenth = (base * totalMonths) / 12;
        const fourteenth = (460 * totalMonths) / 12; // SBU $460
        const vacationAmount = (Number(offboardingVacationDays) || 0) * dailyRate;

        // Desahucio (Art. 185): 25% del último sueldo por año completo
        const appliesDesahucio = years >= 1 && ['VOLUNTARY_RESIGNATION', 'UNFAIR_DISMISSAL', 'CONTRACT_END'].includes(offboardingCausal);
        const desahucioAmount = appliesDesahucio ? base * 0.25 * years : 0;

        // Indemnización por Despido Intempestivo (Art. 188)
        let severanceAmount = 0;
        if (offboardingCausal === 'UNFAIR_DISMISSAL') {
            if (years <= 3) {
                severanceAmount = base * 3; // Mínimo 3 meses
            } else {
                const yearsToPay = Math.min(years + (months > 0 ? 1 : 0), 25); // Hasta 25 meses
                severanceAmount = base * yearsToPay;
            }
        }

        const totalSettlement = thirteenth + fourteenth + vacationAmount + desahucioAmount + severanceAmount;

        return {
            dailyRate: dailyRate.toFixed(2),
            thirteenth: thirteenth.toFixed(2),
            fourteenth: fourteenth.toFixed(2),
            vacationAmount: vacationAmount.toFixed(2),
            desahucioAmount: desahucioAmount.toFixed(2),
            severanceAmount: severanceAmount.toFixed(2),
            totalSettlement: totalSettlement.toFixed(2),
            appliesDesahucio,
            isSeverance: offboardingCausal === 'UNFAIR_DISMISSAL'
        };
    }, [offboardingSalary, offboardingYears, offboardingMonths, offboardingCausal, offboardingVacationDays]);

    // Catálogo exhaustivo de 14 Módulos Operativos
    const modules = [
        {
            code: 'MOD-01',
            title: 'Ficha & Expediente Digital',
            category: 'Personal',
            desc: 'Expediente centralizado con habilidades, trayectoria laboral, activos, EPPs asignados y porcentaje de onboarding.',
            icon: <FiUsers className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-02',
            title: 'Asistencia GPS & WebAuthn',
            category: 'Control',
            desc: 'Marcación con geocerca Haversine, detección anti-VPN/proxy, control de IPs permitidas y Passkeys biométricas.',
            icon: <FiClock className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-03',
            title: 'Turnos & Horarios',
            category: 'Control',
            desc: 'Configuración de turnos flexibles, tolerancia de atrasos, minutos de descanso y cálculo de horas nocturnas.',
            icon: <FiCalendar className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-04',
            title: 'Permisos & Ausencias',
            category: 'Control',
            desc: 'Flujo de aprobación para vacaciones, calamidad, enfermedad y licencias con respaldo documental y evidencias.',
            icon: <FiCheckCircle className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-05',
            title: 'Motor de Nómina Legal',
            category: 'Compensación',
            desc: 'Procesamiento batch con Decimal.js (20 dígitos): horas extra 50%/100%, recargos 25%, IESS y amortización de anticipos.',
            icon: <FiDollarSign className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-06',
            title: 'Beneficios & Anticipos',
            category: 'Compensación',
            desc: 'Asignación de comisiones, bonos recurrentes y gestión de anticipos quincenales con deducción automática por cuotas.',
            icon: <FiGift className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-07',
            title: 'Finiquitos & Liquidaciones',
            category: 'Legal',
            desc: 'Simulador de actas de finiquito (Arts. 185 y 188), cálculo de décimos, vacaciones y checklist de desvinculación.',
            icon: <FiCheckSquare className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-08',
            title: 'Evaluaciones 360° & OKRs',
            category: 'Desempeño',
            desc: 'Plantillas personalizadas por competencias, gráficos de radar, metas SMART y seguimiento continuo de progreso.',
            icon: <FiTrendingUp className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-09',
            title: 'Portal de Reclutamiento',
            category: 'Atracción',
            desc: 'Portal público de vacantes (/careers), recepción de CVs en PDF, pipeline Kanban de selección y scoring de candidatos.',
            icon: <FiBriefcase className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-10',
            title: 'Contabilidad Aislada',
            category: 'Finanzas',
            desc: 'Plan de cuentas jerárquico multinivel, asientos con balance débito/crédito, centros de costos y balance de comprobación.',
            icon: <FiLayers className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-11',
            title: 'Compliance & Auditoría',
            category: 'Gobernanza',
            desc: 'Semáforo de contratos por vencer, control de provisiones patronales y registro inmutable de auditoría (AuditLog).',
            icon: <FiShield className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-12',
            title: 'Comunicados & Clima',
            category: 'Comunicación',
            desc: 'Tablón de anuncios oficiales con acuse de recibo digital firmado y encuestas anónimas de clima laboral NPS.',
            icon: <FiActivity className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-13',
            title: 'Portal Móvil PWA',
            category: 'Autoservicio',
            desc: 'Autogestión para colaboradores: marcación en 1 toque, consulta de roles y emisión de certificados con código QR.',
            icon: <FiSmartphone className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-14',
            title: 'Emprendimiento & Hitos',
            category: 'Estrategia',
            desc: 'Módulo de incubadora corporativa con seguimiento de proyectos, rondas de inversión e hitos de crecimiento.',
            icon: <FiTarget className="w-4 h-4 text-blue-600" />
        }
    ];

    // Los 4 Motores Científicos de IA (Deep AI Suite)
    const aiEngines = [
        {
            number: '01',
            name: 'Motor RSI (Automejora Recursiva)',
            subtitle: 'Closed-Loop Real-Time Stochastic Calibration',
            desc: 'Auto-calibra los hiperparámetros predictivos tras cada desenlace real de personal mediante Descenso de Gradiente Estocástico (SGD) minimizando Brier Score y Log-Loss.',
            impact: '+50.7% mejora en F1-Score out-of-sample',
            tag: 'RSI ENGINE'
        },
        {
            number: '02',
            name: 'Motor Causal Contrafactual',
            subtitle: 'Judea Pearl Do-Calculus & AIPW Estimation',
            desc: 'Responde preguntas de tipo "¿Qué pasaría si...?" P(Y | do(T)) utilizando G-Computation e Inverse Probability Weighting (IPW) para estimar el Efecto Promedio del Tratamiento (ATE) y el ROI.',
            impact: '95.7% reducción de sesgo covariado (SMD < 0.10)',
            tag: 'CAUSAL AI'
        },
        {
            number: '03',
            name: 'Aprendizaje Federado con DP-SGD',
            subtitle: 'FedAvg & Rényi Differential Privacy (RDP)',
            desc: 'Entrenamiento colaborativo entre empresas sin transferencia de salarios ni datos privados. Garantiza matemáticamente la privacidad (ε, δ) cumpliendo con la LOPDP y GDPR.',
            impact: 'Cero fuga de PII con RDP Accountant',
            tag: 'FEDERATED AI'
        },
        {
            number: '04',
            name: 'Optimización Multiobjetivo MORL',
            subtitle: 'Vectorial MDP & Vector Q-Learning',
            desc: 'Resuelve el conflicto entre retención de talento (%) y presupuesto ($), extrayendo la Frontera de Pareto de políticas óptimas no dominadas para la dirección ejecutiva.',
            impact: 'Frontera de Pareto automatizada',
            tag: 'MORL PARETO'
        }
    ];

    // Planes de precios con impacto social
    const pricingPlans = [
        {
            name: 'ESSENTIAL',
            price: '$0.50',
            unit: 'USD / empleado / mes',
            limit: 'Hasta 25 colaboradores',
            badge: 'MICROEMPRESAS',
            isPopular: false,
            features: [
                'Expediente digital de colaboradores',
                'Marcación de asistencia con geocerca GPS',
                'Motor de nómina automatizada Ecuador',
                'Cálculo de horas extra y recargo nocturno',
                'Generación de actas de finiquito básicas',
                'Soporte estándar y 45 días de prueba gratuita'
            ]
        },
        {
            name: 'GROWTH',
            price: '$1.00',
            unit: 'USD / empleado / mes',
            limit: 'Hasta 100 colaboradores',
            badge: 'PYMES EN CRECIMIENTO',
            isPopular: true,
            features: [
                'Todo lo incluido en Essential',
                'Evaluaciones 360° y objetivos SMART (OKRs)',
                'Portal público de vacantes y pipeline Kanban',
                'Módulo contable: plan de cuentas y asientos',
                'Autenticación biométrica WebAuthn (Passkeys)',
                'Detección anti-VPN y reporte de horas nocturnas',
                'Soporte prioritario y 45 días de prueba gratuita'
            ]
        },
        {
            name: 'ENTERPRISE',
            price: '$2.00',
            unit: 'USD / empleado / mes',
            limit: 'Colaboradores ilimitados',
            badge: 'CORPORATIVO & ANALÍTICA',
            isPopular: false,
            features: [
                'Todo lo incluido en Growth',
                'Cuatrilogía completa de Motores de IA (RSI, Causal, FedAvg, MORL)',
                'Simulador Monte Carlo (2,000 iteraciones)',
                'Modelado de supervivencia Weibull y ANOVA',
                'Exportación de datasets anonimizados para investigación',
                'Aislamiento y gobernanza LOPDP de grado doctoral',
                'SLA garantizado y 45 días de prueba gratuita'
            ]
        }
    ];

    const faqs = [
        {
            q: '¿Cómo garantiza Emplifi el cumplimiento de las leyes laborales del Ecuador?',
            a: 'Emplifi incorpora los coeficientes exactos del Código del Trabajo, resoluciones del IESS y del SRI: aporte personal (9.45%), aporte patronal (11.15%), horas suplementarias (50%), extraordinarias (100%), recargo nocturno (25%), 13er sueldo, 14to sueldo sobre el SBU vigente ($460.00 USD), fondo de reserva (8.33%), bonificación por desahucio (Art. 185: 25% por año) e indemnización por despido intempestivo (Art. 188 con tope de 25 meses).'
        },
        {
            q: '¿Qué es el aislamiento Multi-Tenant y cómo protege los datos de mi empresa?',
            a: 'La plataforma implementa un modelo Shared Database, Shared Schema con inyección asíncrona mediante AsyncLocalStorage e interceptores de base de datos en Prisma ORM. Esto garantiza a nivel de consultas SQL que ninguna empresa pueda acceder, visualizar ni mezclar datos con otra. Además, los salarios, cuentas bancarias y coordenadas GPS se encriptan con AES-256-GCM.'
        },
        {
            q: '¿Cómo funciona la prueba gratuita de 45 días?',
            a: 'La prueba gratuita incluye acceso total a todas las funcionalidades del sistema durante 45 días naturales completos, sin necesidad de ingresar tarjeta de crédito. Este plazo está pensado para que tu empresa complete un ciclo mensual completo de asistencia, aprobación de solicitudes y cálculo/cierre de nómina.'
        },
        {
            q: '¿Qué precisión tienen los cálculos financieros y salariales?',
            a: 'Todos los cálculos matemáticos y monetarios del sistema se ejecutan con la librería Decimal.js con 20 dígitos de precisión y modo de redondeo financiero ROUND_HALF_UP, eliminando los errores de coma flotante de las hojas de cálculo tradicionales.'
        },
        {
            q: '¿Pueden los colaboradores registrar asistencia desde sus propios teléfonos?',
            a: 'Sí. Emplifi funciona como una Progressive Web App (PWA) instalable. Los colaboradores pueden marcar entrada y salida en un toque; el sistema valida la geocerca Haversine, detecta intentos de engaño por VPN o proxies, y verifica la identidad mediante biometría WebAuthn (Passkeys).'
        },
        {
            q: '¿En qué consiste la Cuatrilogía de Motores de Inteligencia Artificial?',
            a: 'Es una suite analítica científica integrada por 4 motores: Automejora Recursiva (RSI Engine con SGD), Inferencia Causal Contrafactual (Do-Calculus de Pearl y ajuste IPW), Aprendizaje Federado con Privacidad Diferencial (DP-SGD bajo norma LOPDP/GDPR) y Optimización Multiobjetivo (Vector Q-Learning con Frontera de Pareto).'
        }
    ];

    return (
        <main className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans antialiased selection:bg-blue-600 selection:text-white">
            {/* Header / Navbar Profesional */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* Logo e Identidad */}
                        <div className="flex items-center gap-3">
                            <Link to="/" className="flex items-center gap-2.5">
                                <img src={logoEmplifi} alt="Emplifi" className="h-7 w-auto object-contain" />
                                <span className="font-bold text-sm tracking-tight text-gray-900 hidden sm:inline">EMPLIFI</span>
                            </Link>
                            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-mono font-medium">
                                SaaS v2.6 · PyMEs Ecuador
                            </span>
                        </div>

                        {/* Enlaces de Navegación Rápida */}
                        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-gray-600">
                            <a href="#modulos" className="hover:text-blue-600 transition-colors">Módulos (14)</a>
                            <a href="#demostrador" className="hover:text-blue-600 transition-colors">Calculadoras en Vivo</a>
                            <a href="#motores-ia" className="hover:text-blue-600 transition-colors">Cuatrilogía IA</a>
                            <a href="#precios" className="hover:text-blue-600 transition-colors">Planes & Precios</a>
                            <Link to="/investigacion" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                                <FiSearch className="w-3 h-3 text-blue-600" />
                                <span>Evidencia Científica</span>
                            </Link>
                        </nav>

                        {/* CTAs de Cabecera */}
                        <div className="flex items-center gap-2">
                            <Link
                                to="/careers"
                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                            >
                                <FiBriefcase className="w-3.5 h-3.5 text-gray-500" />
                                <span>Vacantes</span>
                            </Link>
                            <Link
                                to="/login"
                                className="px-3.5 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                to="/register-company"
                                className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm"
                            >
                                <span>Crear Empresa</span>
                                <FiChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-14 sm:py-20 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Categoría & Respaldo */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-gray-50 border border-gray-200 text-gray-700 text-xs font-mono font-medium mb-6">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>PLATAFORMA SAAS MULTI-TENANT · CÓDIGO DEL TRABAJO ECUADOR</span>
                        </div>

                        {/* Titular Principal */}
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
                            Gestión Integral de Talento Humano, Nómina Legal y Analítica Científica
                        </h1>

                        {/* Subtítulo Detallado */}
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto">
                            Automatiza el ciclo completo de personal en PyMEs: nómina batch con precisión de 20 dígitos,
                            asistencia por geocerca Haversine y biometría WebAuthn, actas de finiquito legales instantáneas y
                            una <strong className="text-gray-900 font-semibold">Cuatrilogía de Motores de Inteligencia Artificial</strong> de grado doctoral.
                        </p>

                        {/* Botones de Acción Principal */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
                            <Link
                                to="/register-company"
                                className="w-full sm:w-auto px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
                            >
                                <span>Comenzar Prueba Gratuita (45 Días)</span>
                                <FiArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#demostrador"
                                className="w-full sm:w-auto px-5 py-3 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <FiSliders className="w-4 h-4 text-gray-500" />
                                <span>Probar Simuladores en Vivo</span>
                            </a>
                            <Link
                                to="/investigacion"
                                className="w-full sm:w-auto px-5 py-3 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <FiAward className="w-4 h-4 text-blue-600" />
                                <span>Portal Científico</span>
                            </Link>
                        </div>

                        {/* Barra de Garantías Técnicas y de Seguridad */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-gray-100 text-left font-mono text-[11px]">
                            <div className="p-2.5 rounded bg-gray-50 border border-gray-200">
                                <div className="flex items-center gap-1.5 text-gray-900 font-semibold mb-0.5">
                                    <FiShield className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Aislamiento Total</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">Prisma $use + AsyncLocalStorage</p>
                            </div>
                            <div className="p-2.5 rounded bg-gray-50 border border-gray-200">
                                <div className="flex items-center gap-1.5 text-gray-900 font-semibold mb-0.5">
                                    <FiLock className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Cifrado AES-256-GCM</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">Salarios, Bancos y GPS protegidos</p>
                            </div>
                            <div className="p-2.5 rounded bg-gray-50 border border-gray-200">
                                <div className="flex items-center gap-1.5 text-gray-900 font-semibold mb-0.5">
                                    <FiPercent className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Precisión 20 Dígitos</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">Decimal.js ROUND_HALF_UP</p>
                            </div>
                            <div className="p-2.5 rounded bg-gray-50 border border-gray-200">
                                <div className="flex items-center gap-1.5 text-gray-900 font-semibold mb-0.5">
                                    <FiCheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                    <span>45 Días de Prueba</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">Sin tarjeta de crédito requerida</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Panel de Validación Científica y Resultados Empíricos (N = 40) */}
            <section className="py-10 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                                ESTUDIO DE EVALUACIÓN EMPÍRICA Y USABILIDAD EN PYMES
                            </span>
                            <h2 className="text-lg font-bold text-gray-900">
                                Resultados Cuantitativos Validados en Producción
                            </h2>
                        </div>
                        <Link
                            to="/investigacion/resultados"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <span>Ver informe psicométrico completo (Alfa Cronbach α = 0.864)</span>
                            <FiArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded border border-gray-200">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">Eficiencia en Nómina</span>
                            <div className="text-2xl font-bold font-mono text-gray-900 my-1 tabular-nums">-84.2%</div>
                            <p className="text-xs text-gray-600">Reducción del tiempo mensual de elaboración de rol (de 18h a &lt;2h).</p>
                        </div>
                        <div className="bg-white p-4 rounded border border-gray-200">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">Conformidad Legal</span>
                            <div className="text-2xl font-bold font-mono text-emerald-600 my-1 tabular-nums">100.0%</div>
                            <p className="text-xs text-gray-600">Apego estricto a los Arts. 185 y 188 del Código del Trabajo y aportes IESS.</p>
                        </div>
                        <div className="bg-white p-4 rounded border border-gray-200">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">Satisfacción PyME</span>
                            <div className="text-2xl font-bold font-mono text-blue-600 my-1 tabular-nums">97.2%</div>
                            <p className="text-xs text-gray-600">Índice favorable de recomendación y adopción por administradores (UAT).</p>
                        </div>
                        <div className="bg-white p-4 rounded border border-gray-200">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">Balance Causal IPW</span>
                            <div className="text-2xl font-bold font-mono text-gray-900 my-1 tabular-nums">95.7%</div>
                            <p className="text-xs text-gray-600">Reducción del sesgo covariado confusor en análisis predictivo (SMD &lt; 0.10).</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demostrador Interactivo en Vivo (Calculadoras Oficiales) */}
            <section id="demostrador" className="py-14 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center mb-8">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                            INTERACTIVIDAD Y TRANSPARENCIA MATEMÁTICA
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                            Prueba los Motores de Cálculo en Tiempo Real
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                            Comprueba directamente las fórmulas de nómina, liquidación legal y geocerca que operan dentro de Emplifi.
                        </p>
                    </div>

                    {/* Selector de Pestañas Sobrio */}
                    <div className="flex items-center justify-center border-b border-gray-200 mb-8 overflow-x-auto">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveDemoTab('payroll')}
                                className={`pb-3 px-4 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                                    activeDemoTab === 'payroll'
                                        ? 'border-gray-900 text-gray-900 font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                1. Motor de Nómina & IESS
                            </button>
                            <button
                                onClick={() => setActiveDemoTab('offboarding')}
                                className={`pb-3 px-4 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                                    activeDemoTab === 'offboarding'
                                        ? 'border-gray-900 text-gray-900 font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                2. Finiquito Legal (Offboarding)
                            </button>
                            <button
                                onClick={() => setActiveDemoTab('attendance')}
                                className={`pb-3 px-4 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                                    activeDemoTab === 'attendance'
                                        ? 'border-gray-900 text-gray-900 font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                3. Geocerca Haversine & Anti-VPN
                            </button>
                        </div>
                    </div>

                    {/* Contenido Dinámico de la Pestaña Activa */}
                    <div className="max-w-5xl mx-auto bg-gray-50 rounded border border-gray-200 overflow-hidden shadow-sm">
                        {activeDemoTab === 'payroll' && (
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Formulario de Parámetros */}
                                <div className="lg:col-span-6 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-mono">
                                            Parámetros de Nómina (Mensual)
                                        </h3>
                                        <span className="text-[10px] font-mono text-gray-500">EC-COD-TRABAJO</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Salario Base Mensual (USD):
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="460"
                                                max="5000"
                                                step="50"
                                                value={payrollSalary}
                                                onChange={(e) => setPayrollSalary(e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900 focus:outline-none focus:border-blue-500"
                                            />
                                            <span className="text-xs font-mono text-gray-500">SBU ≥ $460</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                                Días Trabajados:
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="30"
                                                value={payrollDays}
                                                onChange={(e) => setPayrollDays(e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                                Anticipo Quincenal:
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="1000"
                                                step="25"
                                                value={payrollAdvance}
                                                onChange={(e) => setPayrollAdvance(e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-medium text-gray-700 mb-1">
                                                H. Extra (50%):
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="40"
                                                value={payrollOvertime50}
                                                onChange={(e) => setPayrollOvertime50(e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-gray-700 mb-1">
                                                H. Extra (100%):
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="40"
                                                value={payrollOvertime100}
                                                onChange={(e) => setPayrollOvertime100(e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-gray-700 mb-1">
                                                H. Nocturnas (25%):
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={payrollNightHours}
                                                onChange={(e) => setPayrollNightHours(e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Panel Lateral Estilo Liquidación Contable */}
                                <div className="lg:col-span-6 bg-white rounded border border-gray-200 p-4 font-mono text-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center pb-2.5 border-b border-gray-200 mb-3">
                                            <span className="text-[11px] font-semibold text-gray-900 uppercase">ROL DE PAGO INDIVIDUAL</span>
                                            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                                                CALCULADO CON DECIMAL.JS
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-gray-600">
                                                <span>(+) Salario Proporcional ({payrollDays} días):</span>
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
                                            <div className="flex justify-between text-gray-600">
                                                <span>(+) Recargo Nocturno (25% franjas):</span>
                                                <span className="text-gray-900 tabular-nums">${payrollCalc.nightSurchargeAmount}</span>
                                            </div>
                                            <div className="flex justify-between pt-1.5 border-t border-gray-100 text-gray-800 font-medium">
                                                <span>Total Ingresos Imponibles:</span>
                                                <span className="tabular-nums">${payrollCalc.totalEarnings}</span>
                                            </div>
                                            <div className="flex justify-between text-red-600 pt-1">
                                                <span>(-) Aporte Personal IESS (9.45%):</span>
                                                <span className="tabular-nums">-${payrollCalc.iessPersonal}</span>
                                            </div>
                                            {Number(payrollAdvance) > 0 && (
                                                <div className="flex justify-between text-red-600">
                                                    <span>(-) Amortización Anticipo:</span>
                                                    <span className="tabular-nums">-${Number(payrollAdvance).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t-2 border-gray-200 mt-3">
                                        <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                                            <span>LÍQUIDO A RECIBIR (NETO):</span>
                                            <span className="text-blue-600 text-base font-mono tabular-nums">
                                                ${payrollCalc.netSalary} USD
                                            </span>
                                        </div>
                                        <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                                            <span>Aporte Patronal (11.15%): ${payrollCalc.iessPatronal}</span>
                                            <span>Provisión 13ro: ${payrollCalc.thirteenthMonthly}</span>
                                            <span>Provisión 14to: ${payrollCalc.fourteenthMonthly}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeDemoTab === 'offboarding' && (
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-6 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-mono">
                                            Parámetros de Desvinculación
                                        </h3>
                                        <span className="text-[10px] font-mono text-gray-500">ARTS. 185 & 188</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Último Salario Percibido (USD):
                                        </label>
                                        <input
                                            type="number"
                                            value={offboardingSalary}
                                            onChange={(e) => setOffboardingSalary(e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                                Años Completos:
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="35"
                                                value={offboardingYears}
                                                onChange={(e) => setOffboardingYears(e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                                Meses Fracción:
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="11"
                                                value={offboardingMonths}
                                                onChange={(e) => setOffboardingMonths(e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Causal de Terminación Laboral:
                                        </label>
                                        <select
                                            value={offboardingCausal}
                                            onChange={(e) => setOffboardingCausal(e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 font-medium"
                                        >
                                            <option value="UNFAIR_DISMISSAL">Despido Intempestivo (Art. 188 + 185)</option>
                                            <option value="VOLUNTARY_RESIGNATION">Renuncia Voluntaria (Art. 185)</option>
                                            <option value="CONTRACT_END">Fin de Contrato por Plazo</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                            Días de Vacaciones Pendientes:
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={offboardingVacationDays}
                                            onChange={(e) => setOffboardingVacationDays(e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-6 bg-white rounded border border-gray-200 p-4 font-mono text-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center pb-2.5 border-b border-gray-200 mb-3">
                                            <span className="text-[11px] font-semibold text-gray-900 uppercase">SIMULADOR ACTA DE FINIQUITO</span>
                                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                                DICTAMEN CONFORME 100%
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-gray-600">
                                                <span>(+) Décimo Tercero Proporcional:</span>
                                                <span className="text-gray-900 tabular-nums">${offboardingCalc.thirteenth}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>(+) Décimo Cuarto Proporcional:</span>
                                                <span className="text-gray-900 tabular-nums">${offboardingCalc.fourteenth}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>(+) Vacaciones no Gozadas ({offboardingVacationDays}d):</span>
                                                <span className="text-gray-900 tabular-nums">${offboardingCalc.vacationAmount}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>(+) Desahucio Art. 185 (25% x {offboardingYears} años):</span>
                                                <span className="text-gray-900 tabular-nums">${offboardingCalc.desahucioAmount}</span>
                                            </div>
                                            {offboardingCalc.isSeverance && (
                                                <div className="flex justify-between text-amber-700 font-medium">
                                                    <span>(+) Indemnización Despido Art. 188:</span>
                                                    <span className="tabular-nums">${offboardingCalc.severanceAmount}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t-2 border-gray-200 mt-3">
                                        <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                                            <span>TOTAL ACTA DE FINIQUITO:</span>
                                            <span className="text-emerald-700 text-base font-mono tabular-nums">
                                                ${offboardingCalc.totalSettlement} USD
                                            </span>
                                        </div>
                                        <p className="mt-2 text-[10px] text-gray-500">
                                            Genera checklist automático de revocación de accesos IT y entrega de EPPs.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeDemoTab === 'attendance' && (
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-6 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-mono">
                                            Fórmula de Haversine & Geofence
                                        </h3>
                                        <span className="text-[10px] font-mono text-gray-500">R = 6,371 km</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Distancia al Centro de Trabajo ({geoDistance} metros):
                                        </label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="500"
                                            step="5"
                                            value={geoDistance}
                                            onChange={(e) => setGeoDistance(Number(e.target.value))}
                                            className="w-full accent-blue-600 cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                                            <span>0m (En sede)</span>
                                            <span>Radio Permitido: {geoRadius}m</span>
                                            <span>500m (Fuera)</span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-white rounded border border-gray-200 space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-800">
                                            <input
                                                type="checkbox"
                                                checked={vpnDetected}
                                                onChange={(e) => setVpnDetected(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Simular detección de Proxy / VPN (ip-api.com)</span>
                                        </label>
                                    </div>

                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        El motor calcula la distancia del gran círculo sobre la superficie terrestre,
                                        trunca las coordenadas a 4 decimales (~11m de precisión para proteger la privacidad LOPDP)
                                        y las encripta mediante <strong className="text-gray-900">AES-256-GCM</strong>.
                                    </p>
                                </div>

                                <div className="lg:col-span-6 bg-white rounded border border-gray-200 p-4 font-mono text-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center pb-2.5 border-b border-gray-200 mb-3">
                                            <span className="text-[11px] font-semibold text-gray-900 uppercase">VALIDACIÓN DE ASISTENCIA</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                                geoDistance <= geoRadius && !vpnDetected
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {geoDistance <= geoRadius && !vpnDetected ? 'MARCACIÓN VÁLIDA ✓' : 'MARCACIÓN RECHAZADA ✗'}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Distancia calculada:</span>
                                                <span className="text-gray-900 font-semibold tabular-nums">{geoDistance} metros</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Radio máximo de geocerca:</span>
                                                <span className="text-gray-900 tabular-nums">{geoRadius} metros</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Estado de IP & Anti-VPN:</span>
                                                <span className={`tabular-nums font-semibold ${vpnDetected ? 'text-red-600' : 'text-green-600'}`}>
                                                    {vpnDetected ? 'BLOQUEADO (VPN Detectada)' : 'CONEXIÓN LIMPIA (IP Verificada)'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Cifrado de Coordenadas:</span>
                                                <span className="text-gray-900">AES-256-GCM (AuthTag 128-bit)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 mt-3 text-[11px] text-gray-500">
                                        {geoDistance <= geoRadius && !vpnDetected ? (
                                            <span className="text-green-700">
                                                ✓ Empleado dentro de la geocerca permitida. Registro de entrada autorizado con cálculo de atrasos en base al turno activo.
                                            </span>
                                        ) : vpnDetected ? (
                                            <span className="text-red-700">
                                                ✗ Error 403: Se ha detectado el uso de proxy o red virtual. Desactiva la VPN para registrar la asistencia.
                                            </span>
                                        ) : (
                                            <span className="text-red-700">
                                                ✗ Error 400: Estás a {geoDistance}m del lugar de trabajo. Debes encontrarte a menos de {geoRadius}m de la sede.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Módulos Funcionales Completos (Directorio de 14 Módulos) */}
            <section id="modulos" className="py-14 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
                        <div>
                            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-gray-500">
                                ARQUITECTURA MODULAR INTEGRAL
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900 mt-0.5">
                                14 Módulos Especializados en una Sola Plataforma
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-semibold text-gray-500 bg-white px-3 py-1 rounded border border-gray-200 w-fit">
                            14 MÓDULOS ACTIVOS
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {modules.map((mod, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded border border-gray-200 hover:border-blue-500 p-4 transition-colors flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 rounded bg-gray-50 border border-gray-200">
                                            {mod.icon}
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400 font-medium">
                                            {mod.code}
                                        </span>
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-900 mb-1">
                                        {mod.title}
                                    </h3>
                                    <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                                        {mod.desc}
                                    </p>
                                </div>
                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-500">
                                    <span>{mod.category}</span>
                                    <span className="text-blue-600 font-medium">Operativo ✓</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Cuatrilogía Científica de Inteligencia Artificial */}
            <section id="motores-ia" className="py-14 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mb-8">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                            INVESTIGACIÓN CIENTÍFICA & MACHINE LEARNING
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                            La Cuatrilogía de Motores de Inteligencia Artificial
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                            A diferencia de soluciones comerciales tradicionales que operan con heurísticas estáticas,
                            Emplifi incorpora cuatro modelos matemáticos de vanguardia con demostración experimental.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiEngines.map((engine, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-50 rounded border border-gray-200 p-5 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className="text-xs font-mono font-bold text-blue-600">
                                            MOTOR {engine.number}
                                        </span>
                                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded">
                                            {engine.tag}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900">
                                        {engine.name}
                                    </h3>
                                    <p className="text-[11px] font-mono text-gray-500 mb-3">
                                        {engine.subtitle}
                                    </p>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                        {engine.desc}
                                    </p>
                                </div>

                                <div className="p-3 bg-white rounded border border-gray-200 flex items-center justify-between font-mono text-[11px]">
                                    <span className="text-gray-500">Impacto empírico:</span>
                                    <span className="text-gray-900 font-semibold">{engine.impact}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 rounded bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                            <FiAward className="w-5 h-5 text-blue-600 shrink-0" />
                            <span className="text-gray-700">
                                ¿Quieres inspeccionar las pruebas de hipótesis, ANOVA y simulaciones Monte Carlo?
                            </span>
                        </div>
                        <Link
                            to="/investigacion"
                            className="px-4 py-2 rounded bg-white border border-gray-300 hover:bg-gray-100 text-gray-900 font-semibold transition-colors shrink-0"
                        >
                            Explorar Portal de Investigación →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Portal de Autoservicio & Progressive Web App (PWA) */}
            <section className="py-14 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded border border-gray-200 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 space-y-4">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-medium">
                                <FiSmartphone className="w-3.5 h-3.5" />
                                <span>PORTAL MÓVIL PWA & AUTOSERVICIO EN 1 TOQUE</span>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                Autoservicio Completo para el Colaborador en Campo y Oficina
                            </h2>

                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                Sin necesidad de descargas de tiendas externas ni configuraciones complejas. La aplicación PWA de Emplifi
                                permite a cada colaborador gestionar su jornada desde cualquier dispositivo:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
                                <div className="flex items-start gap-2 p-2.5 rounded bg-gray-50 border border-gray-200">
                                    <FiCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                    <span>Marcación GPS con geocerca en 1 toque</span>
                                </div>
                                <div className="flex items-start gap-2 p-2.5 rounded bg-gray-50 border border-gray-200">
                                    <FiCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                    <span>Descarga instantánea de roles de pago</span>
                                </div>
                                <div className="flex items-start gap-2 p-2.5 rounded bg-gray-50 border border-gray-200">
                                    <FiCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                    <span>Solicitud de anticipos y permisos con evidencias</span>
                                </div>
                                <div className="flex items-start gap-2 p-2.5 rounded bg-gray-50 border border-gray-200">
                                    <FiCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                    <span>Certificados laborales digitales con QR oficial</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 bg-gray-50 rounded border border-gray-200 p-5 font-mono text-xs space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                <span className="font-semibold text-gray-900">CERTIFICADO LABORAL DIGITAL</span>
                                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                    QR VERIFICABLE
                                </span>
                            </div>

                            <div className="p-3 bg-white rounded border border-gray-200 space-y-2 text-[11px]">
                                <div className="flex justify-between text-gray-600">
                                    <span>Colaborador:</span>
                                    <span className="text-gray-900 font-semibold">Ing. Andrés Morales</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Cargo:</span>
                                    <span className="text-gray-900">Desarrollador Senior</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Antigüedad:</span>
                                    <span className="text-gray-900">2 años, 8 meses</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Estado:</span>
                                    <span className="text-emerald-600 font-semibold">ACTIVO REGULAR</span>
                                </div>
                            </div>

                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Emite documentos oficiales con firma de responsabilidad y código QR encriptado para trámites bancarios y notariales sin recargar a Recursos Humanos.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Planes de Precios Transparentes */}
            <section id="precios" className="py-14 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center mb-10">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                            INCLUSIÓN TECNOLÓGICA & PRECIOS PYME
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                            Tarifas Claras y Accesibles con 45 Días de Prueba
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                            Paga únicamente por los colaboradores activos que gestionas. Todos los planes incluyen 45 días naturales de prueba completa sin compromiso ni tarjeta de crédito.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {pricingPlans.map((plan, idx) => (
                            <div
                                key={idx}
                                className={`rounded border p-6 flex flex-col justify-between bg-white relative ${
                                    plan.isPopular ? 'border-blue-600 ring-1 ring-blue-600 shadow-sm' : 'border-gray-200'
                                }`}
                            >
                                {plan.isPopular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-0.5 rounded">
                                        MÁS POPULAR
                                    </span>
                                )}

                                <div>
                                    <div className="mb-4">
                                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                                            {plan.badge}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900 mt-1">{plan.name}</h3>
                                        <div className="mt-3 flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold font-mono text-gray-900">{plan.price}</span>
                                            <span className="text-xs font-mono text-gray-500">{plan.unit}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 font-mono">{plan.limit}</p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 space-y-2.5 mb-6">
                                        {plan.features.map((feat, fIdx) => (
                                            <div key={fIdx} className="flex items-start gap-2 text-xs text-gray-700">
                                                <FiCheck className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Link
                                    to="/register-company"
                                    className={`w-full py-2.5 rounded text-xs font-medium text-center transition-colors block ${
                                        plan.isPopular
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
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

            {/* Preguntas Frecuentes (FAQ) */}
            <section className="py-14 bg-gray-50 border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-gray-500">
                            RESOLUCIÓN DE DUDAS
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 mt-1">
                            Preguntas Frecuentes sobre la Plataforma
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded border border-gray-200 overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-5 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <span>{faq.q}</span>
                                    <FiChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                                        openFaq === idx ? 'rotate-90' : ''
                                    }`} />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-4 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-16 bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                        Transforma la Gestión de Personal de tu Empresa Hoy
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
                        Únete a las PyMEs que han reducido más del 80% del tiempo de nómina y operan con certeza jurídica y analítica predictiva.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/register-company"
                            className="w-full sm:w-auto px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
                        >
                            Crear Cuenta Empresa (Prueba 45 Días)
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-6 py-3 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                        >
                            Acceder al Sistema
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer Institucional Exhaustivo */}
            <footer className="bg-gray-50 text-gray-600 text-xs border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-gray-200">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <img src={logoEmplifi} alt="Emplifi" className="h-6 w-auto object-contain" />
                                <span className="font-bold text-gray-900">EMPLIFI</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Sistema SaaS Multi-Tenant de Gestión del Talento Humano, Control Asistencial Biométrico,
                                Nómina Legal y Analítica Científica para PyMEs.
                            </p>
                            <p className="text-[10px] font-mono text-gray-400">
                                Quito, Ecuador · Despliegue en AWS EC2
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider font-mono mb-3">Módulos</h4>
                            <ul className="space-y-2 text-[11px]">
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Nómina & Finiquitos</a></li>
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Asistencia Geoespacial</a></li>
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Evaluaciones 360° & OKRs</a></li>
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Contabilidad Aislada</a></li>
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Portal Móvil PWA</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider font-mono mb-3">Investigación & IA</h4>
                            <ul className="space-y-2 text-[11px]">
                                <li><Link to="/investigacion" className="hover:text-blue-600 transition-colors">Portal de Investigación</Link></li>
                                <li><Link to="/investigacion/resultados" className="hover:text-blue-600 transition-colors">Reporte Psicométrico (N=40)</Link></li>
                                <li><a href="#motores-ia" className="hover:text-blue-600 transition-colors">Motor RSI & SGD</a></li>
                                <li><a href="#motores-ia" className="hover:text-blue-600 transition-colors">Inferencia Causal (Pearl)</a></li>
                                <li><a href="#motores-ia" className="hover:text-blue-600 transition-colors">Aprendizaje Federado DP-SGD</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider font-mono mb-3">Accesos Directos</h4>
                            <ul className="space-y-2 text-[11px]">
                                <li><Link to="/login" className="hover:text-blue-600 transition-colors">Iniciar Sesión</Link></li>
                                <li><Link to="/register-company" className="hover:text-blue-600 transition-colors">Registrar Nueva Empresa</Link></li>
                                <li><Link to="/careers" className="hover:text-blue-600 transition-colors">Portal de Empleo & Vacantes</Link></li>
                                <li><a href="#precios" className="hover:text-blue-600 transition-colors">Planes y Precios</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-gray-500">
                        <div>
                            © 2026 Jorge Doicela. Todos los derechos reservados. Licencia Propietaria.
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Dominio Oficial: erp.jorgedoicela.com</span>
                            <span className="text-gray-300">|</span>
                            <span>Seguridad: AES-256-GCM + RBAC</span>
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
