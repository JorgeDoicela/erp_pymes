import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    FiUsers, FiClock, FiCalendar, FiDollarSign, FiGift,
    FiBriefcase, FiFileText, FiBarChart2, FiTrendingUp,
    FiShield, FiLock, FiLayers, FiCheck, FiChevronRight,
    FiSliders, FiAward, FiSmartphone, FiCheckSquare,
    FiPercent, FiTarget, FiSearch, FiArrowRight, FiActivity,
    FiPieChart, FiGrid, FiHelpCircle, FiCheckCircle
} from 'react-icons/fi';
import logoEmplifi from '../../assets/images/logo_emplifi.png';
import DeveloperCard from '../../components/common/DeveloperCard';

function Home() {
    // Estado del demostrador interactivo en vivo
    const [activeDemoTab, setActiveDemoTab] = useState('payroll');

    // Estado del catálogo de módulos por categoría
    const [activeModuleCategory, setActiveModuleCategory] = useState('all');

    // Estado para la calculadora de Nómina en vivo (Parámetros legales Ecuador)
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
    const [offboardingCausal, setOffboardingCausal] = useState('UNFAIR_DISMISSAL');
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
        const hourlyRate = base / 240;

        const earnedSalary = dailyRate * days;
        const overtime50Amount = (Number(payrollOvertime50) || 0) * hourlyRate * 1.5;
        const overtime100Amount = (Number(payrollOvertime100) || 0) * hourlyRate * 2.0;
        const nightSurchargeAmount = (Number(payrollNightHours) || 0) * hourlyRate * 0.25;
        const totalEarnings = earnedSalary + overtime50Amount + overtime100Amount + nightSurchargeAmount;

        const iessPersonal = totalEarnings * 0.0945;
        const iessPatronal = totalEarnings * 0.1115;
        const thirteenthMonthly = totalEarnings / 12;
        const fourteenthMonthly = 460 / 12;
        const reserveFund = totalEarnings * 0.0833;

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

        const thirteenth = (base * totalMonths) / 12;
        const fourteenth = (460 * totalMonths) / 12;
        const vacationAmount = (Number(offboardingVacationDays) || 0) * dailyRate;

        const appliesDesahucio = years >= 1 && ['VOLUNTARY_RESIGNATION', 'UNFAIR_DISMISSAL', 'CONTRACT_END'].includes(offboardingCausal);
        const desahucioAmount = appliesDesahucio ? base * 0.25 * years : 0;

        let severanceAmount = 0;
        if (offboardingCausal === 'UNFAIR_DISMISSAL') {
            if (years <= 3) {
                severanceAmount = base * 3;
            } else {
                const yearsToPay = Math.min(years + (months > 0 ? 1 : 0), 25);
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

    // Catálogo organizado de Módulos Operativos
    const modules = [
        {
            code: 'MOD-01',
            title: 'Expediente & Ficha Digital',
            category: 'personal',
            categoryName: 'Personal',
            desc: 'Historial laboral, habilidades, contratos, activos y EPPs asignados con seguimiento de onboarding.',
            icon: <FiUsers className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-02',
            title: 'Asistencia GPS & WebAuthn',
            category: 'control',
            categoryName: 'Control',
            desc: 'Marcación con geocerca Haversine, detección anti-VPN y autenticación biométrica segura.',
            icon: <FiClock className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-03',
            title: 'Turnos & Horarios Flexibles',
            category: 'control',
            categoryName: 'Control',
            desc: 'Turnos rotativos, tolerancia de atrasos, cálculo de recargo nocturno y descansos programados.',
            icon: <FiCalendar className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-04',
            title: 'Permisos & Ausencias',
            category: 'control',
            categoryName: 'Control',
            desc: 'Flujo de aprobación para vacaciones, permisos médicos y licencias con adjuntos y evidencias.',
            icon: <FiCheckCircle className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-05',
            title: 'Motor de Nómina Legal',
            category: 'compensacion',
            categoryName: 'Nómina',
            desc: 'Cálculo de horas extra 50%/100%, recargos nocturnos 25%, aportes IESS y emisión de roles.',
            icon: <FiDollarSign className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-06',
            title: 'Beneficios & Anticipos',
            category: 'compensacion',
            categoryName: 'Nómina',
            desc: 'Gestión de anticipos quincenales, bonos por desempeño y amortización por cuotas.',
            icon: <FiGift className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-07',
            title: 'Finiquitos & Liquidaciones',
            category: 'legal',
            categoryName: 'Legal',
            desc: 'Simulador de actas de finiquito (Arts. 185 y 188), cálculo de décimos y checklist de desvinculación.',
            icon: <FiCheckSquare className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-08',
            title: 'Evaluaciones 360° & OKRs',
            category: 'desempeno',
            categoryName: 'Desempeño',
            desc: 'Matrices de competencias, gráficos de radar, objetivos SMART y planes de desarrollo individual.',
            icon: <FiTrendingUp className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-09',
            title: 'Portal de Reclutamiento',
            category: 'talento',
            categoryName: 'Talento',
            desc: 'Página de vacantes pública (/careers), pipeline Kanban de selección y recepción de CVs.',
            icon: <FiBriefcase className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-10',
            title: 'Contabilidad Aislada',
            category: 'finanzas',
            categoryName: 'Finanzas',
            desc: 'Plan de cuentas jerárquico multinivel, asientos con balance débito/crédito y centros de costos.',
            icon: <FiLayers className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-11',
            title: 'Compliance & Auditoría',
            category: 'legal',
            categoryName: 'Legal',
            desc: 'Monitoreo de contratos por vencer, control de provisiones patronales y trazabilidad AuditLog.',
            icon: <FiShield className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-12',
            title: 'Comunicados & Clima Laboral',
            category: 'personal',
            categoryName: 'Personal',
            desc: 'Tablón de anuncios oficiales con acuse de recibo y encuestas anónimas de satisfacción.',
            icon: <FiActivity className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-13',
            title: 'Portal Móvil PWA',
            category: 'personal',
            categoryName: 'Personal',
            desc: 'Autoservicio para colaboradores: marcación en 1 toque, descarga de roles y certificados con QR.',
            icon: <FiSmartphone className="w-4 h-4 text-blue-600" />
        },
        {
            code: 'MOD-14',
            title: 'Emprendimiento & Hitos',
            category: 'desempeno',
            categoryName: 'Estrategia',
            desc: 'Gestión de proyectos internos, asignación presupuestaria y cumplimiento de hitos.',
            icon: <FiTarget className="w-4 h-4 text-blue-600" />
        }
    ];

    const filteredModules = useMemo(() => {
        if (activeModuleCategory === 'all') return modules;
        return modules.filter(m => m.category === activeModuleCategory);
    }, [activeModuleCategory]);

    // Pilares de Inteligencia Aplicada y Analítica
    const aiEngines = [
        {
            number: '01',
            title: 'Automejora Continua del Desempeño',
            tag: 'ADAPTIVE ENGINE',
            desc: 'Calibra continuamente los parámetros de retención y productividad laboral a partir de los desenlaces operativos históricos de la empresa.',
            benefit: 'Ajuste dinámico sin configuraciones manuales complejas'
        },
        {
            number: '02',
            title: 'Análisis Causal & Retorno de Inversión',
            tag: 'CAUSAL INSIGHTS',
            desc: 'Identifica el impacto real de capacitaciones, incentivos y políticas salariales sobre la rotación de personal y la satisfacción.',
            benefit: 'Toma de decisiones respaldada en relaciones de causa-efecto'
        },
        {
            number: '03',
            title: 'Gobernanza de Datos & Privacidad',
            tag: 'ENTERPRISE SECURITY',
            desc: 'Aislamiento estricto de nómina y datos bancarios de colaboradores, cumpliendo con la LOPDP ecuatoriana y estándares internacionales.',
            benefit: 'Encriptación AES-256 y cero mezcla de datos entre empresas'
        },
        {
            number: '04',
            title: 'Optimización de Presupuesto & Retención',
            tag: 'BUDGET OPTIMIZER',
            desc: 'Equilibra el costo de nómina con los índices de retención óptimos mediante modelado de escenarios para la dirección general.',
            benefit: 'Frontera de políticas salariales óptimas para el negocio'
        }
    ];

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
                'Motor de nómina legal para Ecuador',
                'Horas extra 50%/100% y recargo nocturno',
                'Simulador de finiquitos y liquidaciones',
                '45 días de prueba completa sin tarjeta'
            ]
        },
        {
            name: 'Growth',
            price: '$1.00',
            unit: 'USD / empleado / mes',
            limit: 'Hasta 100 colaboradores',
            badge: 'PYMES EN CRECIMIENTO',
            isPopular: true,
            features: [
                'Todo lo incluido en Essential',
                'Evaluaciones 360° y metas SMART (OKRs)',
                'Portal público de vacantes (/careers)',
                'Módulo contable con plan de cuentas y asientos',
                'Autenticación biométrica WebAuthn (Passkeys)',
                'Detección de accesos por VPN / Proxies',
                'Soporte técnico prioritario'
            ]
        },
        {
            name: 'Enterprise',
            price: '$2.00',
            unit: 'USD / empleado / mes',
            limit: 'Colaboradores ilimitados',
            badge: 'CORPORATIVO & ANALÍTICA',
            isPopular: false,
            features: [
                'Todo lo incluido en Growth',
                'Suite completa de analítica predictiva y causal',
                'Simulación de escenarios de rotación y costos',
                'Centros de costos y reportes avanzados de nómina',
                'Portal de evidencia científica e investigación',
                'Acuerdo de nivel de servicio (SLA) preferencial'
            ]
        }
    ];

    const faqs = [
        {
            q: '¿Cómo garantiza Emplifi el cumplimiento legal en Ecuador?',
            a: 'El motor incorpora automáticamente los porcentajes vigentes del Código del Trabajo, IESS y SRI: aporte personal (9.45%), aporte patronal (11.15%), horas suplementarias (50%), extraordinarias (100%), recargo nocturno (25%), decimotercero, decimocuarto (SBU $460.00 USD), fondo de reserva (8.33%), desahucio (Art. 185) y despido intempestivo (Art. 188).'
        },
        {
            q: '¿Cómo funciona la prueba gratuita de 45 días?',
            a: 'La prueba incluye acceso completo a todos los módulos y funciones por 45 días continuos. No requiere tarjeta de crédito al registrar la empresa, lo que permite completar un ciclo completo de asistencia y nómina mensual sin costo.'
        },
        {
            q: '¿Cómo se garantiza la seguridad y privacidad de la información?',
            a: 'Cada empresa opera en un entorno con aislamiento lógico estricto. Las credenciales, remuneraciones, cuentas bancarias y coordenadas GPS se encriptan con AES-256-GCM, garantizando el cumplimiento de la Ley Orgánica de Protección de Datos Personales (LOPDP).'
        },
        {
            q: '¿Los colaboradores pueden marcar asistencia desde sus propios teléfonos?',
            a: 'Sí. Emplifi funciona como una Progressive Web App (PWA) rápida y liviana. Los colaboradores pueden registrar su entrada y salida desde el móvil verificando la geocerca permitida y sin requerir descargas pesadas desde tiendas de aplicaciones.'
        },
        {
            q: '¿Qué precisión tienen los cálculos salariales y contables?',
            a: 'Todos los cálculos financieros y salariales se realizan con precisión de alta escala mediante aritmética decimal exacta y redondeo financiero bancario, eliminando inconsistencias de centavos.'
        }
    ];

    return (
        <main className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans antialiased selection:bg-blue-600 selection:text-white">
            {/* Header / Barra de Navegación Principal */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* Identidad de Marca */}
                        <div className="flex items-center gap-3">
                            <Link to="/" className="flex items-center gap-2.5">
                                <img src={logoEmplifi} alt="Emplifi" className="h-7 w-auto object-contain" />
                                <span className="font-bold text-sm tracking-tight text-gray-900 hidden sm:inline">EMPLIFI</span>
                            </Link>
                            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-mono font-medium">
                                SaaS ERP · Ecuador
                            </span>
                        </div>

                        {/* Navegación Principal */}
                        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-gray-600">
                            <a href="#modulos" className="hover:text-blue-600 transition-colors">Módulos</a>
                            <a href="#simulador" className="hover:text-blue-600 transition-colors">Simuladores</a>
                            <a href="#analitica" className="hover:text-blue-600 transition-colors">Analítica</a>
                            <a href="#precios" className="hover:text-blue-600 transition-colors">Precios</a>
                            <Link to="/investigacion" className="hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                                <FiSearch className="w-3 h-3 text-blue-600" />
                                <span>Investigación</span>
                            </Link>
                        </nav>

                        {/* Botones de Acción */}
                        <div className="flex items-center gap-2">
                            <Link
                                to="/careers"
                                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                            >
                                <FiBriefcase className="w-3.5 h-3.5 text-gray-500" />
                                <span>Vacantes</span>
                            </Link>
                            <Link
                                to="/login"
                                className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
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
            <section className="py-12 sm:py-16 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-gray-50 border border-gray-200 text-gray-700 text-xs font-mono font-medium mb-5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>SISTEMA DE GESTIÓN HUMANA Y NÓMINA LEGAL · ECUADOR</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                            Gestión integral de personal y nómina legal para PyMEs
                        </h1>

                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-7 max-w-2xl mx-auto">
                            Automatiza roles de pago con el Código del Trabajo y aportes IESS, control asistencial con geocerca GPS,
                            expedientes de colaboradores y finiquitos instantáneos en una plataforma confiable y segura.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                            <Link
                                to="/register-company"
                                className="w-full sm:w-auto px-6 py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
                            >
                                <span>Iniciar Prueba Gratuita (45 Días)</span>
                                <FiArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#simulador"
                                className="w-full sm:w-auto px-5 py-2.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <FiSliders className="w-4 h-4 text-gray-500" />
                                <span>Probar Simuladores</span>
                            </a>
                        </div>

                        {/* Indicadores de Confianza Institucional */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-gray-100 text-left font-mono text-[11px]">
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <div className="text-gray-900 font-semibold mb-0.5 flex items-center gap-1.5">
                                    <FiShield className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Normativa Ecuador</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">Código del Trabajo & IESS</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <div className="text-gray-900 font-semibold mb-0.5 flex items-center gap-1.5">
                                    <FiLock className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Cifrado Bancario</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">AES-256 & LOPDP</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <div className="text-gray-900 font-semibold mb-0.5 flex items-center gap-1.5">
                                    <FiPercent className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Cálculo Exacto</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">Aritmética de alta precisión</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <div className="text-gray-900 font-semibold mb-0.5 flex items-center gap-1.5">
                                    <FiCheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                    <span>45 Días Libres</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">Sin tarjeta de crédito</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vista Previa del Producto / Mock Operativo Realista */}
            <section className="py-10 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                        {/* Barra Superior del Sistema Mock */}
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between font-mono text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                <span className="ml-2 text-gray-500 text-[11px]">panel.emplifi.ec · Vista Operativa de Empresa</span>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                                NÓMINA ACTIVA
                            </span>
                        </div>

                        {/* Contenido Visual del Mock */}
                        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Panel Izquierdo: Resumen de Colaboradores */}
                            <div className="lg:col-span-8 space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-mono">
                                            Personal en Turno Activo
                                        </h3>
                                        <p className="text-[11px] text-gray-500">Marcaciones validadas por geocerca GPS</p>
                                    </div>
                                    <span className="text-xs font-mono font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                        12 / 12 Presentes
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead>
                                            <tr className="border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider">
                                                <th className="pb-2 font-medium">Colaborador</th>
                                                <th className="pb-2 font-medium">Cargo</th>
                                                <th className="pb-2 font-medium">Entrada</th>
                                                <th className="pb-2 font-medium">Ubicación GPS</th>
                                                <th className="pb-2 font-medium text-right">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-[11px]">
                                            <tr>
                                                <td className="py-2 font-semibold text-gray-900">Carlos Méndez</td>
                                                <td className="py-2 text-gray-600">Supervisor de Planta</td>
                                                <td className="py-2 text-gray-600">08:00 AM</td>
                                                <td className="py-2 text-gray-600">Sede Principal (42m)</td>
                                                <td className="py-2 text-right">
                                                    <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200 text-[10px]">
                                                        Puntual
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 font-semibold text-gray-900">Elena Salgado</td>
                                                <td className="py-2 text-gray-600">Contadora General</td>
                                                <td className="py-2 text-gray-600">08:02 AM</td>
                                                <td className="py-2 text-gray-600">Sede Principal (18m)</td>
                                                <td className="py-2 text-right">
                                                    <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200 text-[10px]">
                                                        Puntual
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 font-semibold text-gray-900">David Vaca</td>
                                                <td className="py-2 text-gray-600">Técnico de Campo</td>
                                                <td className="py-2 text-gray-600">08:14 AM</td>
                                                <td className="py-2 text-gray-600">Sucursal Norte (95m)</td>
                                                <td className="py-2 text-right">
                                                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 text-[10px]">
                                                        Tolerancia (14m)
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Panel Derecho: Resumen Financiero Estilo Contable */}
                            <div className="lg:col-span-4 bg-gray-50 rounded border border-gray-200 p-4 font-mono text-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-3">
                                        <span className="text-[11px] font-semibold text-gray-900 uppercase">Resumen de Nómina</span>
                                        <span className="text-[10px] text-gray-500">MES EN CURSO</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-gray-600 text-[11px]">
                                            <span>Masa Salarial Base:</span>
                                            <span className="text-gray-900 font-semibold tabular-nums">$9,850.00</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 text-[11px]">
                                            <span>Horas Extraordinarias:</span>
                                            <span className="text-gray-900 tabular-nums">$412.50</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 text-[11px]">
                                            <span>Aporte Personal IESS:</span>
                                            <span className="text-red-600 tabular-nums">-$969.80</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 text-[11px]">
                                            <span>Aporte Patronal (11.15%):</span>
                                            <span className="text-gray-900 tabular-nums">$1,144.27</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-gray-200 mt-3 flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-900">Total Líquido:</span>
                                    <span className="text-blue-600 font-bold tabular-nums">$9,292.70 USD</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simuladores Interactivos en Vivo */}
            <section id="simulador" className="py-14 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mx-auto text-center mb-8">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                            TRANSPARENCIA & MOTOR DE CÁLCULO
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 mt-1">
                            Simuladores Oficiales en Tiempo Real
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                            Comprueba directamente las fórmulas de nómina, actas de finiquito y control por geocerca que rigen el sistema.
                        </p>
                    </div>

                    {/* Selector de Pestañas de Simulación */}
                    <div className="flex items-center justify-center border-b border-gray-200 mb-8 overflow-x-auto">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveDemoTab('payroll')}
                                className={`pb-3 px-4 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                                    activeDemoTab === 'payroll'
                                        ? 'border-blue-600 text-blue-600 font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                1. Rol de Pago & Aportes IESS
                            </button>
                            <button
                                onClick={() => setActiveDemoTab('offboarding')}
                                className={`pb-3 px-4 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                                    activeDemoTab === 'offboarding'
                                        ? 'border-blue-600 text-blue-600 font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                2. Acta de Finiquito Legal
                            </button>
                            <button
                                onClick={() => setActiveDemoTab('attendance')}
                                className={`pb-3 px-4 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                                    activeDemoTab === 'attendance'
                                        ? 'border-blue-600 text-blue-600 font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                3. Geocerca GPS & Detección VPN
                            </button>
                        </div>
                    </div>

                    {/* Contenido Dinámico de Simuladores */}
                    <div className="max-w-5xl mx-auto bg-gray-50 rounded border border-gray-200 overflow-hidden shadow-sm">
                        {/* Tab 1: Rol de Pago */}
                        {activeDemoTab === 'payroll' && (
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-6 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-mono">
                                            Parámetros de Nómina (Ecuador)
                                        </h3>
                                        <span className="text-[10px] font-mono text-gray-500">SBU: $460.00</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Salario Base Mensual (USD):
                                        </label>
                                        <input
                                            type="number"
                                            min="460"
                                            max="5000"
                                            step="50"
                                            value={payrollSalary}
                                            onChange={(e) => setPayrollSalary(e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900 focus:outline-none focus:border-blue-500"
                                        />
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
                                                Horas Extra 50%:
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
                                                Horas Extra 100%:
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
                                                Horas Nocturnas 25%:
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

                                <div className="lg:col-span-6 bg-white rounded border border-gray-200 p-4 font-mono text-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center pb-2.5 border-b border-gray-200 mb-3">
                                            <span className="text-[11px] font-semibold text-gray-900 uppercase">Desglose del Rol Individual</span>
                                            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                                                IESS CONFORME
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
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
                                            <div className="flex justify-between text-gray-600">
                                                <span>(+) Recargo Nocturno (25%):</span>
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
                                                    <span>(-) Anticipo Descontado:</span>
                                                    <span className="tabular-nums">-${Number(payrollAdvance).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t-2 border-gray-200 mt-3">
                                        <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                                            <span>LÍQUIDO A PAGAR:</span>
                                            <span className="text-blue-600 text-base font-mono tabular-nums">
                                                ${payrollCalc.netSalary} USD
                                            </span>
                                        </div>
                                        <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                                            <span>Patronal 11.15%: ${payrollCalc.iessPatronal}</span>
                                            <span>13ro: ${payrollCalc.thirteenthMonthly}</span>
                                            <span>14to: ${payrollCalc.fourteenthMonthly}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Finiquito */}
                        {activeDemoTab === 'offboarding' && (
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-6 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-mono">
                                            Datos de Terminación Laboral
                                        </h3>
                                        <span className="text-[10px] font-mono text-gray-500">ARTS. 185 & 188</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Último Sueldo Percibido (USD):
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
                                                Meses Adicionales:
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
                                            Causal de Salida:
                                        </label>
                                        <select
                                            value={offboardingCausal}
                                            onChange={(e) => setOffboardingCausal(e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900"
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
                                            <span className="text-[11px] font-semibold text-gray-900 uppercase">Acta de Liquidación Legal</span>
                                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                                CÓDIGO DEL TRABAJO
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
                                            <span>TOTAL LIQUIDACIÓN:</span>
                                            <span className="text-emerald-700 text-base font-mono tabular-nums">
                                                ${offboardingCalc.totalSettlement} USD
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Asistencia GPS */}
                        {activeDemoTab === 'attendance' && (
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-6 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-mono">
                                            Geocerca GPS de la Sede
                                        </h3>
                                        <span className="text-[10px] font-mono text-gray-500">Radio: {geoRadius}m</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Distancia del empleado al centro de trabajo ({geoDistance}m):
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
                                            <span>Límite: {geoRadius}m</span>
                                            <span>500m (Lejos)</span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-white rounded border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-800">
                                            <input
                                                type="checkbox"
                                                checked={vpnDetected}
                                                onChange={(e) => setVpnDetected(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600"
                                            />
                                            <span>Simular uso de VPN o Proxy en dispositivo</span>
                                        </label>
                                    </div>

                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        El sistema valida las coordenadas del colaborador en milisegundos mediante la fórmula de Haversine y bloquea intentos de falseo de ubicación.
                                    </p>
                                </div>

                                <div className="lg:col-span-6 bg-white rounded border border-gray-200 p-4 font-mono text-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center pb-2.5 border-b border-gray-200 mb-3">
                                            <span className="text-[11px] font-semibold text-gray-900 uppercase">Resultado de Marcación</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                                geoDistance <= geoRadius && !vpnDetected
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {geoDistance <= geoRadius && !vpnDetected ? 'MARCACIÓN ACEPTADA ✓' : 'MARCACIÓN RECHAZADA ✗'}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-[11px]">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Distancia a la sede:</span>
                                                <span className="text-gray-900 font-semibold tabular-nums">{geoDistance} metros</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Geocerca configurada:</span>
                                                <span className="text-gray-900 tabular-nums">{geoRadius} metros</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Detección de VPN / Proxy:</span>
                                                <span className={`font-semibold ${vpnDetected ? 'text-red-600' : 'text-green-600'}`}>
                                                    {vpnDetected ? 'Detectado (Bloqueo 403)' : 'Conexión Directa'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 mt-3 text-[11px]">
                                        {geoDistance <= geoRadius && !vpnDetected ? (
                                            <span className="text-green-700 font-medium">
                                                ✓ Registro aprobado y guardado en expediente.
                                            </span>
                                        ) : vpnDetected ? (
                                            <span className="text-red-700 font-medium">
                                                ✗ Marcación rechazada: se detectó una red virtual.
                                            </span>
                                        ) : (
                                            <span className="text-red-700 font-medium">
                                                ✗ Fuera del radio de {geoRadius}m permitido.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Directorio Modular de la Plataforma */}
            <section id="modulos" className="py-14 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-gray-500">
                                ARQUITECTURA MODULAR INTEGRAL
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900 mt-0.5">
                                Todo lo que tu empresa necesita en un solo sistema
                            </h2>
                        </div>

                        {/* Filtros por Categoría */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {[
                                { id: 'all', label: 'Todos (14)' },
                                { id: 'compensacion', label: 'Nómina' },
                                { id: 'control', label: 'Asistencia' },
                                { id: 'personal', label: 'Personal' },
                                { id: 'desempeno', label: 'Desempeño' },
                                { id: 'legal', label: 'Legal' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveModuleCategory(tab.id)}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                        activeModuleCategory === tab.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grilla de Módulos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredModules.map((mod, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded border border-gray-200 hover:border-gray-300 p-4 transition-colors flex flex-col justify-between shadow-xs"
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
                                    <span>{mod.categoryName}</span>
                                    <span className="text-blue-600 font-medium">Activo ✓</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Analítica Avanzada & Toma de Decisiones */}
            <section id="analitica" className="py-14 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mb-8">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                            INTELIGENCIA & ANALÍTICA DE TALENTO
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 mt-1">
                            Toma de decisiones respaldada en datos reales
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                            Modelos analíticos diseñados para prevenir la rotación involuntaria y optimizar el presupuesto salarial de la empresa.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiEngines.map((engine, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-50 rounded border border-gray-200 p-5 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-mono font-bold text-blue-600">
                                            PILAR {engine.number}
                                        </span>
                                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded">
                                            {engine.tag}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                                        {engine.title}
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                        {engine.desc}
                                    </p>
                                </div>

                                <div className="p-3 bg-white rounded border border-gray-200 flex items-center justify-between font-mono text-[11px]">
                                    <span className="text-gray-500">Beneficio:</span>
                                    <span className="text-gray-900 font-semibold">{engine.benefit}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Enlace al portal de evidencia científica */}
                    <div className="mt-6 p-4 rounded bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                            <FiAward className="w-5 h-5 text-blue-600 shrink-0" />
                            <span className="text-gray-700">
                                ¿Deseas revisar el estudio empírico y los resultados de evaluación en PyMEs?
                            </span>
                        </div>
                        <Link
                            to="/investigacion"
                            className="px-4 py-2 rounded bg-white border border-gray-300 hover:bg-gray-100 text-gray-900 font-semibold transition-colors shrink-0"
                        >
                            Ver Portal de Investigación →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Autoservicio Móvil & Progressive Web App (PWA) */}
            <section className="py-14 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded border border-gray-200 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 space-y-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-medium">
                                <FiSmartphone className="w-3.5 h-3.5" />
                                <span>PORTAL MÓVIL PWA · AUTOSERVICIO</span>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                Autoservicio instantáneo para cada colaborador
                            </h2>

                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                Sin descargas obligatorias de tiendas externas. La aplicación PWA de Emplifi permite que cada empleado gestione su jornada desde cualquier dispositivo:
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
                                    <span>Solicitud de anticipos y permisos</span>
                                </div>
                                <div className="flex items-start gap-2 p-2.5 rounded bg-gray-50 border border-gray-200">
                                    <FiCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                    <span>Certificados laborales digitales con QR</span>
                                </div>
                            </div>
                        </div>

                        {/* Tarjeta de Certificado Digital con QR */}
                        <div className="lg:col-span-5 bg-gray-50 rounded border border-gray-200 p-5 font-mono text-xs space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                <span className="font-semibold text-gray-900">CERTIFICADO LABORAL DIGITAL</span>
                                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                    VERIFICABLE
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
                                Emite certificados y roles firmados digitalmente para trámites bancarios y notariales sin recargar al departamento de RRHH.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Planes y Precios Transparentes */}
            <section id="precios" className="py-14 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mx-auto text-center mb-10">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                            PLANES ACCESIBLES
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 mt-1">
                            Precios claros y sin sorpresas
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                            Paga únicamente por los colaboradores activos que gestionas. Todos los planes incluyen 45 días de prueba completa sin compromiso.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

            {/* Preguntas Frecuentes */}
            <section className="py-14 bg-gray-50 border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-gray-500">
                            RESOLUCIÓN DE DUDAS
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 mt-1">
                            Preguntas Frecuentes
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
                                    className="w-full px-5 py-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
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
            <section className="py-14 bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Optimiza la gestión laboral de tu empresa hoy
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mb-6 max-w-xl mx-auto leading-relaxed">
                        Crea tu empresa en minutos y accede a 45 días de prueba completa con soporte y todas las funciones activadas.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/register-company"
                            className="w-full sm:w-auto px-6 py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
                        >
                            Crear Cuenta Empresa (45 Días Gratis)
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-6 py-2.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                        >
                            Acceder al Sistema
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer Institucional */}
            <footer className="bg-gray-50 text-gray-600 text-xs border-t border-gray-200 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-gray-200">
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <img src={logoEmplifi} alt="Emplifi" className="h-6 w-auto object-contain" />
                                <span className="font-bold text-gray-900">EMPLIFI</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Sistema ERP de Gestión del Talento Humano, Nómina Legal y Control Asistencial para PyMEs en Ecuador.
                            </p>
                            <p className="text-[10px] font-mono text-gray-400">
                                Quito, Ecuador
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider font-mono mb-3">Módulos</h4>
                            <ul className="space-y-2 text-[11px]">
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Nómina & Finiquitos</a></li>
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Asistencia Geoespacial</a></li>
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Evaluaciones 360°</a></li>
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Contabilidad Aislada</a></li>
                                <li><a href="#modulos" className="hover:text-blue-600 transition-colors">Portal Móvil PWA</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider font-mono mb-3">Investigación</h4>
                            <ul className="space-y-2 text-[11px]">
                                <li><Link to="/investigacion" className="hover:text-blue-600 transition-colors">Portal de Investigación</Link></li>
                                <li><Link to="/investigacion/resultados" className="hover:text-blue-600 transition-colors">Reporte Psicométrico (N=40)</Link></li>
                                <li><a href="#analitica" className="hover:text-blue-600 transition-colors">Modelos de Desempeño</a></li>
                                <li><a href="#analitica" className="hover:text-blue-600 transition-colors">Gobernanza LOPDP</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider font-mono mb-3">Accesos Directos</h4>
                            <ul className="space-y-2 text-[11px]">
                                <li><Link to="/login" className="hover:text-blue-600 transition-colors">Iniciar Sesión</Link></li>
                                <li><Link to="/register-company" className="hover:text-blue-600 transition-colors">Registrar Nueva Empresa</Link></li>
                                <li><Link to="/careers" className="hover:text-blue-600 transition-colors">Portal de Vacantes</Link></li>
                                <li><a href="#precios" className="hover:text-blue-600 transition-colors">Planes & Tarifas</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-gray-500">
                        <div>
                            © 2026 Jorge Doicela. Todos los derechos reservados.
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Dominio: erp.jorgedoicela.com</span>
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
