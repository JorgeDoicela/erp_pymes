import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitResearchSurvey } from '../api/researchApi';
import QrCodeModal from '../components/common/QrCodeModal';
import { BsQrCodeScan } from 'react-icons/bs';

export default function PublicResearchPage() {
    const [selectedForm, setSelectedForm] = useState('POST_SYSTEM');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const [demographics, setDemographics] = useState({
        respondentRole: 'Administrador / Asistente Administrativo',
        companySize: 'Pequeña empresa (10 - 49 emp)',
        economicSector: 'Comercio / Ventas',
        experienceYears: '1 a 3 años',
        academicDegree: 'Tercer Nivel (Licenciatura / Ingeniería)'
    });

    const [answers, setAnswers] = useState({});

    const handleLikertChange = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleTextChange = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!demographics.respondentRole || !demographics.companySize || !demographics.economicSector) {
            toast.error('Por favor complete los datos del negocio.');
            return;
        }

        const answeredCount = Object.keys(answers).length;
        if (answeredCount < 3) {
            toast.error('Por favor responda las preguntas principales de la encuesta.');
            return;
        }

        try {
            setIsSubmitting(true);
            await submitResearchSurvey({
                surveyType: selectedForm,
                ...demographics,
                answers
            });

            toast.success('Respuesta registrada correctamente.');
            setIsSubmittedSuccess(true);
        } catch (error) {
            const msg = error.response?.data?.message || 'Error al enviar la encuesta.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formsMetadata = {
        PRE_SYSTEM: {
            title: 'Formulario 1 — Diagnóstico de Gestión Actual (Línea Base)',
            description: 'Identificación de problemas con hojas de cálculo, cuadernos, atrasos y cálculo manual de nómina en pequeños negocios.',
            badge: 'Diagnóstico PyME Actual',
            badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
        },
        POST_SYSTEM: {
            title: 'Formulario 2 — Evaluación de Usabilidad y Utilidad (Prueba de Usuarios)',
            description: 'Facilidad de uso, rapidez de marcación, ahorro de tiempo en nómina y utilidad del portal del empleado en Emplifi.',
            badge: 'Evaluación de Emplifi',
            badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        },
        EXPERT_EVAL: {
            title: 'Formulario 3 — Validación Técnica (Contadores y Gestores de Talento)',
            description: 'Revisión técnica de cálculos de décimos, liquidaciones de finiquito y cumplimiento del Código de Trabajo de Ecuador.',
            badge: 'Validación Técnica / Legal',
            badgeBg: 'bg-blue-50 text-blue-800 border-blue-200'
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-16">
            {/* Modal de Código QR Proyectable para la Audiencia del Congreso */}
            <QrCodeModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                title="Escanear Encuesta de Validación"
                description="Apunta la cámara de tu teléfono móvil a este código QR para abrir el formulario y responder en vivo."
            />

            {/* Header ERP Empresarial */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center font-mono font-bold text-white text-sm">
                            E
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                                Encuesta de Evaluación Emplifi
                                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                    Estudio PyMEs
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500">
                                Validación práctica de gestión de recursos humanos y nómina para pequeños y medianos negocios
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsQrModalOpen(true)}
                            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer bg-white flex items-center gap-1.5"
                            title="Proyectar Código QR para escaneo por parte de los asistentes"
                        >
                            <BsQrCodeScan className="w-3.5 h-3.5 text-gray-600" />
                            <span>Proyectar QR</span>
                        </button>
                        <button
                            onClick={() => { setSelectedForm('POST_SYSTEM'); setIsSubmittedSuccess(false); }}
                            className="px-3.5 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            Responder Encuesta
                        </button>
                        <Link
                            to="/investigacion/resultados"
                            className="px-3.5 py-1.5 rounded text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Ver Resultados
                        </Link>
                        <Link
                            to="/login"
                            className="px-3 py-1.5 rounded text-xs font-medium text-gray-500 hover:text-gray-900"
                        >
                            Acceso Sistema
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {isSubmittedSuccess ? (
                    <div className="bg-white border border-gray-200 rounded-md p-8 text-center my-8">
                        <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xs font-bold mb-3">
                            OK
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">¡Gracias por su colaboración!</h2>
                        <p className="text-xs text-gray-600 max-w-xl mx-auto leading-relaxed mb-6">
                            Su respuesta ha sido registrada exitosamente y nos ayuda a seguir mejorando la plataforma para los negocios del país.
                        </p>
                        <div className="flex justify-center gap-3">
                            <Link
                                to="/investigacion/resultados"
                                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                            >
                                Ver Resultados Consolidados
                            </Link>
                            <button
                                onClick={() => { setIsSubmittedSuccess(false); setAnswers({}); }}
                                className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs transition-colors"
                            >
                                Llenar otra encuesta
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Selector de Formulario */}
                        <div className="mb-6">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Seleccione la Encuesta a Responder</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {Object.keys(formsMetadata).map(key => {
                                    const meta = formsMetadata[key];
                                    const isSelected = selectedForm === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => { setSelectedForm(key); setAnswers({}); }}
                                            className={`text-left p-4 rounded-md border transition-colors flex flex-col justify-between ${
                                                isSelected
                                                    ? 'bg-white border-blue-600 ring-1 ring-blue-600'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div>
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mb-2 ${meta.badgeBg}`}>
                                                    {meta.badge}
                                                </span>
                                                <h3 className="font-semibold text-gray-900 text-xs mb-1">{meta.title}</h3>
                                                <p className="text-[11px] text-gray-500 leading-normal">{meta.description}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="mt-3 text-[11px] font-semibold text-blue-600">
                                                    Seleccionado
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Formulario Principal */}
                        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-md p-6">
                            <div className="border-b border-gray-200 pb-4 mb-6">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold border mb-1.5 ${formsMetadata[selectedForm].badgeBg}`}>
                                    {formsMetadata[selectedForm].badge}
                                </span>
                                <h2 className="text-base font-semibold text-gray-900">{formsMetadata[selectedForm].title}</h2>
                                <p className="text-xs text-gray-500 mt-0.5">{formsMetadata[selectedForm].description}</p>
                            </div>

                            {/* Sección 1: Perfil del Negocio */}
                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                    1. Datos del Negocio y Encuestado
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Cargo o Rol en el Negocio</label>
                                        <select
                                            value={demographics.respondentRole}
                                            onChange={e => setDemographics({ ...demographics, respondentRole: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Dueño / Gerente General">Dueño / Gerente General</option>
                                            <option value="Administrador / Asistente Administrativo">Administrador / Asistente Administrativo</option>
                                            <option value="Encargado de Talento Humano / Personal">Encargado de Talento Humano / Personal</option>
                                            <option value="Contador / Auxiliar Contable">Contador / Auxiliar Contable</option>
                                            <option value="Empleado / Colaborador Operativo">Empleado / Colaborador Operativo</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Tamaño del Negocio</label>
                                        <select
                                            value={demographics.companySize}
                                            onChange={e => setDemographics({ ...demographics, companySize: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Microempresa (1 - 9 emp)">Microempresa (1 - 9 empleados)</option>
                                            <option value="Pequeña empresa (10 - 49 emp)">Pequeña empresa (10 - 49 empleados)</option>
                                            <option value="Mediana empresa (50 - 100 emp)">Mediana empresa (50 - 100 empleados)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Actividad o Sector</label>
                                        <select
                                            value={demographics.economicSector}
                                            onChange={e => setDemographics({ ...demographics, economicSector: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Comercio / Ventas">Comercio / Ventas</option>
                                            <option value="Servicios Profesionales / Tecnología">Servicios Profesionales / Tecnología</option>
                                            <option value="Gastronomía / Restaurantes / Hotelería">Gastronomía / Restaurantes / Hotelería</option>
                                            <option value="Manufactura / Talleres / Producción">Manufactura / Talleres / Producción</option>
                                            <option value="Salud / Educación / Otros">Salud / Educación / Otros</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Tiempo de Funcionamiento</label>
                                        <select
                                            value={demographics.experienceYears}
                                            onChange={e => setDemographics({ ...demographics, experienceYears: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Menos de 1 año (Emprendimiento)">Menos de 1 año (Emprendimiento)</option>
                                            <option value="1 a 3 años">1 a 3 años</option>
                                            <option value="4 a 8 años">4 a 8 años</option>
                                            <option value="Más de 8 años">Más de 8 años</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Nivel de Formación</label>
                                        <select
                                            value={demographics.academicDegree}
                                            onChange={e => setDemographics({ ...demographics, academicDegree: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Bachillerato">Bachillerato</option>
                                            <option value="Técnico / Tecnológico">Técnico / Tecnológico</option>
                                            <option value="Tercer Nivel (Licenciatura / Ingeniería)">Tercer Nivel (Licenciatura / Ingeniería)</option>
                                            <option value="Posgrado / Especialización">Posgrado / Especialización</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Sección 2: Preguntas Escala Likert */}
                            <div className="mb-6 border-t border-gray-200 pt-5">
                                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    2. Valoración de Afirmaciones (Escala del 1 al 5)
                                </h3>
                                <p className="text-[11px] text-gray-500 mb-4">
                                    Indique su nivel de acuerdo de 1 (Totalmente en desacuerdo / Nunca) a 5 (Totalmente de acuerdo / Siempre).
                                </p>

                                <div className="space-y-4">
                                    {getQuestionsForForm(selectedForm).map((q, idx) => (
                                        <div key={q.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded">
                                            <p className="text-xs font-medium text-gray-800 leading-relaxed mb-2.5">
                                                <span className="font-semibold text-gray-900 mr-1">{idx + 1}.</span>
                                                {q.text}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map(rating => {
                                                    const isChecked = answers[q.id] === rating;
                                                    return (
                                                        <button
                                                            key={rating}
                                                            type="button"
                                                            onClick={() => handleLikertChange(q.id, rating)}
                                                            className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors border ${
                                                                isChecked
                                                                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <span className="font-mono">{rating}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sección 3: Observaciones Abiertas */}
                            <div className="mb-6 border-t border-gray-200 pt-5">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Comentarios, dudas o sugerencias adicionales (Opcional)
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Cuéntenos su experiencia o alguna necesidad específica de su negocio..."
                                    value={answers.comments || ''}
                                    onChange={e => handleTextChange('comments', e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 placeholder:text-gray-400"
                                ></textarea>
                            </div>

                            {/* Acciones */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-4">
                                <p className="text-[11px] text-gray-500">
                                    Información confidencial para la validación y mejora del sistema Emplifi.
                                </p>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Respuesta'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}

function getQuestionsForForm(formType) {
    if (formType === 'PRE_SYSTEM') {
        return [
            { id: 'pre_1_manual_attendance', text: 'El registro diario de asistencia y atrasos se lleva en hojas de papel, cuadernos o plantillas de Excel.' },
            { id: 'pre_2_buddy_punching', text: 'Resulta difícil evitar que los empleados firmen por otros compañeros o justifiquen atrasos sin sustento.' },
            { id: 'pre_3_overtime_calc_hours', text: 'El cálculo manual de horas extra (50%), extraordinarias (100%) y atrasos toma mucho tiempo a fin de mes.' },
            { id: 'pre_4_fragmented_files', text: 'Los contratos, expedientes de empleados y permisos están dispersos en carpetas físicas o archivos sueltos.' },
            { id: 'pre_5_decimos_confusion', text: 'Se han presentado confusiones o dudas al calcular décimos (13ro y 14to sueldo) o fondos de reserva.' },
            { id: 'pre_6_severance_errors_fear', text: 'El cálculo de liquidaciones y actas de finiquito genera temor a cometer errores frente al Ministerio de Trabajo.' },
            { id: 'pre_7_subjective_performance', text: 'Las evaluaciones del personal se hacen al "ojo" o por intuición, sin un registro claro de su rendimiento.' },
            { id: 'pre_8_turnover_risk_blindness', text: 'Cuesta anticipar cuándo un empleado clave piensa renunciar debido a la falta de seguimiento continuo.' },
            { id: 'pre_9_unencrypted_salaries', text: 'Los sueldos y datos personales se guardan en computadoras compartidas sin contraseñas seguras.' },
            { id: 'pre_10_needs_simple_tool', text: 'El negocio necesita una herramienta sencilla y económica para organizar todo el personal en un solo lugar.' }
        ];
    }

    if (formType === 'POST_SYSTEM') {
        return [
            { id: 'post_1_navigation_usability', text: 'El sistema es fácil de entender y usar sin necesidad de capacitaciones complejas o manuales largos.' },
            { id: 'post_2_geofence_passkey_speed', text: 'El marcado de asistencia desde el celular o computadora es rápido y ayuda a controlar atrasos reales.' },
            { id: 'post_3_payroll_time_savings', text: 'El cálculo automático del rol de pagos ahorra horas de trabajo en comparación con hacerlo en Excel.' },
            { id: 'post_4_severance_automation_safety', text: 'La generación automática de liquidaciones de finiquito da seguridad y ahorra consultas legales costosas.' },
            { id: 'post_5_employee_portal_utility', text: 'El portal del empleado permite que el personal revise sus roles de pago y solicitudes sin interrumpir al jefe.' },
            { id: 'post_6_performance_retention_alerts', text: 'La evaluación de desempeño y alertas de retención ayudan a reconocer al buen trabajador a tiempo.' },
            { id: 'post_7_digital_contracts_order', text: 'Tener los expedientes y contratos digitales ordenados en la nube evita pérdidas de documentos.' },
            { id: 'post_8_salary_privacy_confidence', text: 'La protección con clave y permisos resguarda la privacidad de los sueldos en la empresa.' },
            { id: 'post_9_cost_benefit_affordable', text: 'El costo y los beneficios del sistema son accesibles y rentables para el presupuesto de un pequeño negocio.' },
            { id: 'post_10_recommend_system', text: 'Recomendaría Emplifi a otros dueños de negocios o administradores de mi sector.' }
        ];
    }

    return [
        { id: 'exp_1_labor_law_overtime_accuracy', text: 'La parametrización de horas suplementarias (50%), extraordinarias (100%) y aportes al IESS es correcta.' },
        { id: 'exp_2_decimos_and_funds_precision', text: 'La fórmula de cálculo del 13ro, 14to sueldo y fondos de reserva se ajusta al Código del Trabajo ecuatoriano.' },
        { id: 'exp_3_severance_articles_compliance', text: 'El cálculo de desahucio (Art. 185) y despido intempestivo (Art. 188) genera liquidaciones transparentes y precisas.' },
        { id: 'exp_4_payroll_structure_standard', text: 'La estructura de los roles de pago y comprobantes cumple con los estándares exigidos para PyMEs.' },
        { id: 'exp_5_biometric_geofence_validity', text: 'El control biométrico/geolocalizado ofrece un soporte válido y confiable para justificar la jornada laboral.' },
        { id: 'exp_6_simplifies_compliance_sme', text: 'El sistema simplifica el cumplimiento laboral de una pequeña empresa sin requerir personal contable dedicado.' },
        { id: 'exp_7_practical_ready_deployment', text: 'Considero que Emplifi es una solución viable, práctica y lista para implementarse en negocios reales.' }
    ];
}
