import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // Direct axios call or service update needed
import { FiBriefcase, FiMapPin, FiClock, FiUpload, FiCheckCircle } from 'react-icons/fi';

const JobApplication = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vacancy, setVacancy] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '', coverLetter: ''
    });
    const [resume, setResume] = useState(null);
    const [status, setStatus] = useState('ideal'); // ideal, submitting, success, error, already_applied
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    useEffect(() => {
        // Fetch public vacancy details (we need a service wrapper properly or use raw axios here for simplicity in this file for now if service not updated yet)
        // Updating service first properly is better practice
        const fetchDetails = async () => {
            try {
                // RNF: Anti-Spam - Check if already applied from this browser
                if (localStorage.getItem(`applied_${id}`)) {
                    setStatus('already_applied');
                }
                const res = await api.get(`/recruitment/public/${id}`);
                setVacancy(res.data);
            } catch (e) { console.error(e); }
        };
        fetchDetails();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (resume) data.append('resume', resume);

        try {
            await api.post(`/recruitment/public/${id}/apply`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            localStorage.setItem(`applied_${id}`, 'true');
            setStatus('success');
        } catch (error) {
            console.error(error);
            if (error.response?.status === 413) {
                alert("El archivo es demasiado grande para el servidor (Límite 4MB en Vercel). Por favor intente con uno más pequeño.");
            } else {
                alert(error.response?.data?.message || "Ocurrió un error al enviar la postulación. Intente de nuevo.");
            }
            setStatus('error');
        }
    };

    if (!vacancy) return <div className="p-10 text-center">Cargando...</div>;
    if (status === 'success' || status === 'already_applied') return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-100 text-center max-w-lg scale-in-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                    <FiCheckCircle className="text-white text-4xl" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3">
                    {status === 'already_applied' ? '¡Ya estás postulado!' : '¡Postulación Recibida!'}
                </h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    {status === 'already_applied'
                        ? 'Tu solicitud para esta vacante ya ha sido registrada anteriormente. Nuestro equipo de RRHH está procesando tu perfil.'
                        : 'Hemos recibido tu información correctamente. Nuestro equipo de RRHH revisará tu perfil y te contactará pronto.'}
                </p>
                <button
                    onClick={() => navigate('/careers')}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                    Explorar Otras Ofertas
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-6 md:py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-white p-6 md:p-8 border-b border-slate-100 text-center sm:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold mb-4 text-slate-800">{vacancy.title}</h1>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 md:gap-6 text-sm">
                        <span className="flex items-center text-slate-600"><FiMapPin className="mr-2 text-slate-400" /> {vacancy.location}</span>
                        <span className="flex items-center text-slate-600"><FiBriefcase className="mr-2 text-slate-400" /> {vacancy.department}</span>
                        <span className="flex items-center text-slate-600"><FiClock className="mr-2 text-slate-400" /> {vacancy.employmentType}</span>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <div className="mb-8 space-y-6">
                        <section>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Descripción</h3>
                            <p className="text-gray-600 whitespace-pre-line">{vacancy.description}</p>
                        </section>
                        <section>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Requisitos</h3>
                            <p className="text-gray-600 whitespace-pre-line">{vacancy.requirements}</p>
                        </section>
                        {vacancy.benefits && (
                            <section>
                                <h3 className="font-bold text-lg text-gray-900 mb-2">Beneficios</h3>
                                <p className="text-gray-600 whitespace-pre-line">{vacancy.benefits}</p>
                            </section>
                        )}
                    </div>

                    <hr className="my-8" />

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 text-center sm:text-left">Aplica a esta vacante</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input required type="text" className="w-full bg-white text-slate-800 border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                <input required type="text" className="w-full bg-white text-slate-800 border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input required type="email" className="w-full bg-white text-slate-800 border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input required type="tel" className="w-full bg-white text-slate-800 border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CV / Hoja de Vida (PDF)</label>
                            <label className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                <input required type="file" accept="application/pdf" className="hidden" onChange={e => {
                                    const file = e.target.files[0];
                                    if (file && file.size > 4 * 1024 * 1024) {
                                        alert("El archivo es demasiado grande. El límite es 4MB.");
                                        e.target.value = null;
                                        setResume(null);
                                        return;
                                    }
                                    setResume(file);
                                }} />
                                <div className="text-center">
                                    <FiUpload className="mx-auto text-gray-400 text-3xl mb-2" />
                                    <span className="text-gray-600 block">{resume ? resume.name : "Haz clic para subir tu PDF"}</span>
                                </div>
                            </label>
                            <p className="text-[10px] text-slate-400 mt-1">Límite máximo: 4MB</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Carta de Presentación (Opcional)</label>
                            <textarea rows="4" className="w-full bg-white text-slate-800 border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.coverLetter} onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}></textarea>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    required
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-xs text-slate-600 leading-relaxed">
                                    Acepto el <strong className="text-slate-800">Tratamiento de Datos Personales</strong>.
                                    Entiendo que mi información será procesada exclusivamente para fines de reclutamiento y selección de personal,
                                    conforme a la <a href="https://www.telecomunicaciones.gob.ec/wp-content/uploads/2021/06/Ley-Organica-de-Datos-Personales.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador</a>.
                                </span>
                            </label>
                        </div>

                        <button
                            disabled={status === 'submitting' || !acceptedTerms}
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                        >
                            {status === 'submitting' ? 'Enviando Datos...' : 'Enviar Postulación'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobApplication;
