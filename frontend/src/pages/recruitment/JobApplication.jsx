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
    const [status, setStatus] = useState('ideal'); // ideal, submitting, success, error

    useEffect(() => {
        // Fetch public vacancy details (we need a service wrapper properly or use raw axios here for simplicity in this file for now if service not updated yet)
        // Updating service first properly is better practice
        const fetchDetails = async () => {
            try {
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
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (!vacancy) return <div className="p-10 text-center">Cargando...</div>;
    if (status === 'success') return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-lg">
                <FiCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Postulación Enviada!</h2>
                <p className="text-gray-600 mb-8">Hemos recibido tu información correctamente. Nuestro equipo de RRHH revisará tu perfil y te contactará pronto.</p>
                <button onClick={() => navigate('/careers')} className="text-blue-600 font-bold hover:underline">Volver a Empleos</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-900 p-8 text-white">
                    <h1 className="text-3xl font-bold mb-4">{vacancy.title}</h1>
                    <div className="flex flex-wrap gap-6 text-sm">
                        <span className="flex items-center"><FiMapPin className="mr-2" /> {vacancy.location}</span>
                        <span className="flex items-center"><FiBriefcase className="mr-2" /> {vacancy.department}</span>
                        <span className="flex items-center"><FiClock className="mr-2" /> {vacancy.employmentType}</span>
                    </div>
                </div>

                <div className="p-8">
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

                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Aplica a esta vacante</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input required type="text" className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                <input required type="text" className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input required type="email" className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input required type="tel" className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CV / Hoja de Vida (PDF)</label>
                            <label className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                <input required type="file" accept="application/pdf" className="hidden" onChange={e => setResume(e.target.files[0])} />
                                <div className="text-center">
                                    <FiUpload className="mx-auto text-gray-400 text-3xl mb-2" />
                                    <span className="text-gray-600 block">{resume ? resume.name : "Haz clic para subir tu PDF"}</span>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Carta de Presentación (Opcional)</label>
                            <textarea rows="4" className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.coverLetter} onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}></textarea>
                        </div>

                        <button
                            disabled={status === 'submitting'}
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {status === 'submitting' ? 'Enviando...' : 'Enviar Postulación'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobApplication;
