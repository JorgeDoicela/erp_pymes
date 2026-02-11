import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../../hooks/employees/useEmployees';
import { InputField, SelectField } from './components/EmployeeHelpers';
import { CIVIL_STATUS_OPTIONS, CONTRACT_TYPES, ACCOUNT_TYPES, BANK_OPTIONS, DEPARTMENTS } from '../../constants/employeeOptions';
import { validateCedula, validateEmail, validatePhone, validateSalary, validateDates } from '../../utils/validationUtils';

const RegisterEmployee = ({ token }) => {
    const navigate = useNavigate();
    const { registerEmployee, loading } = useEmployees(token);
    const [hasSavedData, setHasSavedData] = useState(!!localStorage.getItem('employee_form_autosave'));

    // UI Local state for form
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        identityCard: '',
        email: '',
        phone: '',
        address: '',
        birthDate: '',
        civilStatus: '',
        department: '',
        position: '',
        salary: '',
        hireDate: '',
        contractType: '',
        bankName: '',
        accountNumber: '',
        accountType: 'Ahorros',
        hasNightSurcharge: true,
        hasDoubleOvertime: true
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };
        setFormData(updatedData);

        // Autosave a localStorage
        localStorage.setItem('employee_form_autosave', JSON.stringify(updatedData));

        // Limpiar error de campo al escribir
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Función para recuperar datos manualmente si se desea (aunque se podría hacer en un useEffect)
    const recoverData = () => {
        const saved = localStorage.getItem('employee_form_autosave');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setFormData(parsed);
                toast.success('Datos recuperados de la sesión anterior');
            } catch (e) {
                console.error('Error al recuperar autosave', e);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validaciones de front-end
        const errors = {};
        const cedulaErr = validateCedula(formData.identityCard);
        if (cedulaErr) errors.identityCard = cedulaErr;

        const emailErr = validateEmail(formData.email);
        if (emailErr) errors.email = emailErr;

        const phoneErr = validatePhone(formData.phone);
        if (phoneErr) errors.phone = phoneErr;

        const salaryErr = validateSalary(formData.salary);
        if (salaryErr) errors.salary = salaryErr;

        const dateErr = validateDates(formData.birthDate, formData.hireDate);
        if (dateErr) errors.dates = dateErr; // Error general de coherencia

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Por favor corrija los errores en el formulario');
            toast.error('Datos del formulario inválidos');
            return;
        }

        try {
            const dataToSend = {
                ...formData,
                salary: Number(formData.salary)
            };

            await registerEmployee(dataToSend);
            localStorage.removeItem('employee_form_autosave'); // Limpiar autosave al éxito
            toast.success('Empleado registrado exitosamente');
            navigate('/admin/employees');
        } catch (err) {
            setError(err.message || 'Error al registrar empleado');
            toast.error(err.message || 'Error al registrar empleado');
        }
    };

    return (
        <div className="space-y-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Registro de Empleado
                    </h2>
                    <p className="text-slate-500 mb-8">Ingrese los datos para registrar un nuevo colaborador.</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {hasSavedData && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 flex justify-between items-center">
                            <span>Tienes un borrador guardado automáticamente. ¿Deseas recuperarlo?</span>
                            <button
                                onClick={() => { recoverData(); setHasSavedData(false); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm font-bold transition-colors"
                            >
                                Recuperar Datos
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Información Personal */}
                        <section>
                            <h3 className="text-xl font-semibold text-blue-600 mb-4 border-b border-slate-200 pb-2">Información Personal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField label="Nombre" name="firstName" value={formData.firstName} onChange={handleChange} />
                                <InputField label="Apellido" name="lastName" value={formData.lastName} onChange={handleChange} />
                                <InputField label="Cédula" name="identityCard" value={formData.identityCard} onChange={handleChange} error={fieldErrors.identityCard} />
                                <InputField label="Fecha de Nacimiento" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} />
                                <SelectField label="Estado Civil" name="civilStatus" value={formData.civilStatus} onChange={handleChange}
                                    options={CIVIL_STATUS_OPTIONS}
                                />
                                <InputField label="Dirección" name="address" value={formData.address} onChange={handleChange} />
                                <InputField label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} error={fieldErrors.phone} />
                                <InputField label="Email Personal" name="email" type="email" value={formData.email} onChange={handleChange} error={fieldErrors.email} />
                            </div>
                            {fieldErrors.dates && <p className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{fieldErrors.dates}</p>}
                        </section>

                        {/* Información Laboral */}
                        <section>
                            <h3 className="text-xl font-semibold text-emerald-600 mb-4 border-b border-slate-200 pb-2">Información Laboral</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <SelectField label="Departamento" name="department" value={formData.department} onChange={handleChange}
                                    options={DEPARTMENTS}
                                />
                                <InputField label="Cargo" name="position" value={formData.position} onChange={handleChange} />
                                <InputField label="Fecha de Ingreso" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} />
                                <SelectField label="Tipo de Contrato" name="contractType" value={formData.contractType} onChange={handleChange}
                                    options={CONTRACT_TYPES}
                                />
                                <InputField label="Salario Base ($)" name="salary" type="number" min="0" step="0.01" value={formData.salary} onChange={handleChange} error={fieldErrors.salary} />
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="text-sm font-semibold text-slate-700 md:col-span-2 mb-2">Configuración Laboral (Ecuador)</h4>
                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white cursor-pointer border border-transparent hover:border-slate-200 transition-all">
                                    <input
                                        type="checkbox"
                                        name="hasNightSurcharge"
                                        checked={formData.hasNightSurcharge}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hasNightSurcharge: e.target.checked }))}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-800">Pago Nocturno (25%)</span>
                                        <span className="text-xs text-slate-500">Recargo de 19:00 a 06:00</span>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white cursor-pointer border border-transparent hover:border-slate-200 transition-all">
                                    <input
                                        type="checkbox"
                                        name="hasDoubleOvertime"
                                        checked={formData.hasDoubleOvertime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hasDoubleOvertime: e.target.checked }))}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-800">Pago Fines de Semana (100%)</span>
                                        <span className="text-xs text-slate-500">Doble sueldo Sáb/Dom/Feriados</span>
                                    </div>
                                </label>
                            </div>
                        </section>

                        {/* Información Bancaria */}
                        <section>
                            <h3 className="text-xl font-semibold text-purple-600 mb-4 border-b border-slate-200 pb-2">Información Bancaria</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <SelectField label="Banco" name="bankName" value={formData.bankName} onChange={handleChange}
                                    options={BANK_OPTIONS}
                                />
                                <InputField
                                    label="Número de Cuenta"
                                    name="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    help="Número de cuenta bancaria para el depósito de nómina."
                                />
                                <SelectField label="Tipo de Cuenta" name="accountType" value={formData.accountType} onChange={handleChange}
                                    options={ACCOUNT_TYPES}
                                />
                            </div>
                        </section>

                        <div className="flex justify-end pt-4 border-t border-slate-200 mt-8">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="mr-4 px-6 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 flex items-center font-medium"
                            >
                                ← Volver
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Registrando...' : 'Registrar Empleado'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterEmployee;
