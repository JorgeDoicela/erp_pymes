import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvaluationTemplates, assignEvaluation } from '../../services/evaluation.service';
import { getEmployees } from '../../services/employees/employee.service';
import { FiSave, FiArrowLeft, FiSearch, FiCheckSquare, FiSquare } from 'react-icons/fi';

const AssignEvaluation = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Form Selection State
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Selection State
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedEvaluators, setSelectedEvaluators] = useState([]);

    // Filters
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [evaluatorSearch, setEvaluatorSearch] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // Token is auto-injected by axios interceptor, but getEmployees service might be manually overriding headers if we don't pass it, 
            // OR if it expects it as an arg.
            // Looking at getEmployees service: `const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};`
            // If token is undefined, config is {}. Axios interceptor runs AFTER (or merges).
            // But to be safe and consistent with other services:
            const token = localStorage.getItem('token');

            // getEvaluationTemplates uses api.get directly so interceptor works.
            // getEmployees uses api.get(url, config). If config is empty, interceptor adds header.
            // HOWEVER, let's pass the token explicitly to getEmployees just to be 100% sure as per its signature.

            const [templatesData, employeesData] = await Promise.all([
                getEvaluationTemplates(),
                getEmployees(token)
            ]);

            // Handle different variations of response structures
            setTemplates(Array.isArray(templatesData) ? templatesData : (templatesData.data || []));

            const loadedEmployees = Array.isArray(employeesData) ? employeesData : (employeesData.data || []);
            setEmployees(loadedEmployees);

            // Auto-select current user as evaluator
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const currentUser = JSON.parse(storedUser);
                // Verify current user exists in the loaded employees list to avoid ID mismatches
                if (loadedEmployees.find(e => e.id === currentUser.id)) {
                    setSelectedEvaluators([currentUser.id]);
                }
            }
        } catch (error) {
            console.error("Error loading data:", error);
            // If 401, maybe redirect?
        }
    };

    const toggleEmployeeSelection = (id) => {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const toggleEvaluatorSelection = (id) => {
        setSelectedEvaluators(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const handleSelectAllEmployees = () => {
        if (selectedEmployees.length === employees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(employees.map(e => e.id));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTemplate || !startDate || !endDate || !selectedEmployees.length || !selectedEvaluators.length) {
            alert("Por favor complete todos los campos y seleccione al menos un empleado y un evaluador.");
            return;
        }

        setLoading(true);
        try {
            await assignEvaluation({
                templateId: selectedTemplate,
                employeeIds: selectedEmployees,
                evaluatorIds: selectedEvaluators,
                startDate,
                endDate
            });
            alert('Evaluaciones asignadas exitosamente');
            navigate('/performance');
        } catch (error) {
            console.error(error);
            alert('Error al asignar evaluaciones');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        e.department.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    const filteredEvaluators = employees.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(evaluatorSearch.toLowerCase()) ||
        e.department.toLowerCase().includes(evaluatorSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate('/performance')}
                    className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <FiArrowLeft className="mr-2" /> Volver al Tablero
                </button>

                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Asignar Evaluación
                </h1>
                <p className="text-gray-400 mb-8">Distribuye una evaluación a empleados y asigna sus evaluadores.</p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Step 1: Configuration */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-purple-300">1. Configuración General</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Plantilla de Evaluación</label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                >
                                    <option value="">Seleccionar Plantilla</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.title} ({t.period})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Fecha Límite</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Step 2: Select Employees */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col h-[500px]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-blue-300">2. Empleados a Evaluar ({selectedEmployees.length})</h2>
                                <button type="button" onClick={handleSelectAllEmployees} className="text-xs text-blue-400 hover:text-white">
                                    {selectedEmployees.length === employees.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                </button>
                            </div>
                            <div className="relative mb-3">
                                <FiSearch className="absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar empleado..."
                                    value={employeeSearch}
                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 p-2 text-white"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {filteredEmployees.map(emp => (
                                    <div
                                        key={emp.id}
                                        onClick={() => toggleEmployeeSelection(emp.id)}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedEmployees.includes(emp.id) ? 'bg-blue-900/40 border border-blue-500/50' : 'bg-gray-700/50 hover:bg-gray-700'}`}
                                    >
                                        <div className={`mr-3 ${selectedEmployees.includes(emp.id) ? 'text-blue-400' : 'text-gray-500'}`}>
                                            {selectedEmployees.includes(emp.id) ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-xs text-gray-400">{emp.position} - {emp.department}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step 3: Select Evaluators */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col h-[500px]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-green-300">3. Seleccionar Evaluadores ({selectedEvaluators.length})</h2>
                            </div>
                            <div className="relative mb-3">
                                <FiSearch className="absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar evaluador..."
                                    value={evaluatorSearch}
                                    onChange={(e) => setEvaluatorSearch(e.target.value)}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 p-2 text-white"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {filteredEvaluators.map(emp => (
                                    <div
                                        key={emp.id}
                                        onClick={() => toggleEvaluatorSelection(emp.id)}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedEvaluators.includes(emp.id) ? 'bg-green-900/40 border border-green-500/50' : 'bg-gray-700/50 hover:bg-gray-700'}`}
                                    >
                                        <div className={`mr-3 ${selectedEvaluators.includes(emp.id) ? 'text-green-400' : 'text-gray-500'}`}>
                                            {selectedEvaluators.includes(emp.id) ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-xs text-gray-400">{emp.position} - {emp.department}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <FiSave className="mr-2" />
                            {loading ? 'Asignando...' : 'Confirmar Asignación'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AssignEvaluation;
