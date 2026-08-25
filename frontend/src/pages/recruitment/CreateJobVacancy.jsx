import { useState } from 'react';
import { createVacancy } from '../../services/recruitment.service';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CreateJobVacancy = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        description: '',
        requirements: '',
        benefits: '',
        salaryMin: '',
        salaryMax: '',
        location: 'Quito - Presencial',
        employmentType: 'Tiempo completo',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await createVacancy(formData);
            toast.success('Oferta laboral publicada exitosamente');
            navigate('/recruitment');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al publicar la vacante');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            {/* Header ERP */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <button
                            onClick={() => navigate('/recruitment')}
                            className="hover:text-gray-900 transition-colors flex items-center gap-1 text-gray-600 cursor-pointer"
                        >
                            <FiArrowLeft size={12} /> Reclutamiento y Vacantes
                        </button>
                        <span>·</span>
                        <span>Nueva Publicación</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Crear Oferta Laboral
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded border border-gray-200 text-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Título del Cargo o Puesto *</label>
                        <input
                            required
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            placeholder="Ej: Ejecutivo Comercial B2B"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Departamento / Área *</label>
                        <input
                            required
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            placeholder="Ej: Ventas, Tecnología, Operaciones"
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-medium text-gray-700 mb-1">Descripción de Funciones y Responsabilidades *</label>
                    <textarea
                        required
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Describe el rol y objetivo del cargo..."
                    />
                </div>

                <div>
                    <label className="block font-medium text-gray-700 mb-1">Requisitos del Perfil *</label>
                    <textarea
                        required
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        rows="3"
                        className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="- Al menos 2 años de experiencia previa&#10;- Título de tercer nivel o afín&#10;- Manejo de herramientas clave"
                    />
                </div>

                <div>
                    <label className="block font-medium text-gray-700 mb-1">Beneficios y Compensación Opcional</label>
                    <textarea
                        name="benefits"
                        value={formData.benefits}
                        onChange={handleChange}
                        rows="2"
                        className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="- Seguro médico privado&#10;- Plan de carrera y capacitación"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Modalidad y Ubicación *</label>
                        <input
                            required
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                            placeholder="Ej: Quito - Híbrido"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Tipo de Jornada</label>
                        <select
                            name="employmentType"
                            value={formData.employmentType}
                            onChange={handleChange}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                        >
                            <option value="Tiempo completo">Tiempo Completo</option>
                            <option value="Medio tiempo">Medio Tiempo</option>
                            <option value="Por horas / Servicios">Por Servicios</option>
                            <option value="Pasantía">Pasantía / Formativo</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Fecha Límite de Recepción *</label>
                        <input
                            required
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-200 rounded">
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Rango Salarial Mínimo (USD)</label>
                        <input
                            type="number"
                            name="salaryMin"
                            value={formData.salaryMin}
                            onChange={handleChange}
                            placeholder="Ej: 900"
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono tabular-nums"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Rango Salarial Máximo (USD)</label>
                        <input
                            type="number"
                            name="salaryMax"
                            value={formData.salaryMax}
                            onChange={handleChange}
                            placeholder="Ej: 1400"
                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono tabular-nums"
                        />
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/recruitment')}
                        className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                        <FiSave size={13} />
                        <span>{submitting ? 'Publicando...' : 'Publicar Oferta Laboral'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateJobVacancy;
