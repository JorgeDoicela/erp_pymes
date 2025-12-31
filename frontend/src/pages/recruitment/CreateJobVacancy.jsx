import { useState } from 'react';
import { createVacancy } from '../../services/recruitment.service';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

const CreateJobVacancy = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        description: '',
        requirements: '',
        benefits: '',
        salaryMin: '',
        salaryMax: '',
        location: '',
        employmentType: 'Full-time',
        deadline: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createVacancy(formData);
            alert("Vacante publicada exitosamente");
            navigate('/recruitment');
        } catch (error) {
            alert("Error al crear la vacante");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white mb-6">
                    <FiArrowLeft className="mr-2" /> Volver
                </button>

                <h1 className="text-3xl font-bold mb-8">Nueva Oferta de Trabajo</h1>

                <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Título del Puesto *</label>
                            <input required name="title" value={formData.title} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" placeholder="Ej: Desarrollador Senior" />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Departamento</label>
                            <input required name="department" value={formData.department} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" placeholder="Ej: Tecnología" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Descripción del Puesto *</label>
                        <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" placeholder="Responsabilidades y contexto..." />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Requisitos *</label>
                        <textarea required name="requirements" value={formData.requirements} onChange={handleChange} rows="4" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" placeholder="- Experiencia en React&#10;- Inglés Avanzado" />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Beneficios</label>
                        <textarea name="benefits" value={formData.benefits} onChange={handleChange} rows="3" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" placeholder="- Seguro Médico&#10;- Trabajo Remoto" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Ubicación *</label>
                            <input required name="location" value={formData.location} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" placeholder="Ej: Quito, Híbrido" />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Tipo de Empleo</label>
                            <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white">
                                <option value="Full-time">Tiempo Completo</option>
                                <option value="Part-time">Medio Tiempo</option>
                                <option value="Contract">Contrato</option>
                                <option value="Internship">Pasantía</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Fecha Límite *</label>
                            <input required type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-gray-700/30 p-4 rounded-lg">
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Salario Mínimo (USD)</label>
                            <input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Salario Máximo (USD)</label>
                            <input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center shadow-lg hover:shadow-blue-500/20 transition-all">
                            <FiSave className="mr-2" /> Publicar Vacante
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateJobVacancy;
