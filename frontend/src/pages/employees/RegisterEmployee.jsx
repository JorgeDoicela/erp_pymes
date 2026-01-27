import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../../hooks/employees/useEmployees';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import { CIVIL_STATUS_OPTIONS, CONTRACT_TYPES, ACCOUNT_TYPES, BANK_OPTIONS, DEPARTMENTS } from '../../constants/employeeOptions';
import { validateCedula, validateEmail, validatePhone, validateSalary, validateDates } from '../../utils/validationUtils';

const RegisterEmployee = ({ token }) => {
    const navigate = useNavigate();
    const { registerEmployee, loading } = useEmployees(token);

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
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpiar error de campo al escribir
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
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
            toast.success('Empleado registrado exitosamente');
            navigate('/admin/employees');
        } catch (err) {
            setError(err.message || 'Error al registrar empleado');
            toast.error(err.message || 'Error al registrar empleado');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 flex items-center justify-center">
            <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                <div className="p-8">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                        Registro de Empleado
                    </h2>
                    <p className="text-slate-400 mb-8">Ingrese los datos para registrar un nuevo colaborador.</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Información Personal */}
                        <section>
                            <h3 className="text-xl font-semibold text-blue-300 mb-4 border-b border-white/10 pb-2">Información Personal</h3>
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
                            {fieldErrors.dates && <p className="mt-4 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">{fieldErrors.dates}</p>}
                        </section>

                        {/* Información Laboral */}
                        <section>
                            <h3 className="text-xl font-semibold text-emerald-300 mb-4 border-b border-white/10 pb-2">Información Laboral</h3>
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

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <h4 className="text-sm font-semibold text-slate-300 md:col-span-2 mb-2">Configuración Laboral (Ecuador)</h4>
                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-slate-600 transition-all">
                                    <input
                                        type="checkbox"
                                        name="hasNightSurcharge"
                                        checked={formData.hasNightSurcharge}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hasNightSurcharge: e.target.checked }))}
                                        className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white">Pago Nocturno (25%)</span>
                                        <span className="text-xs text-slate-400">Recargo de 19:00 a 06:00</span>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-slate-600 transition-all">
                                    <input
                                        type="checkbox"
                                        name="hasDoubleOvertime"
                                        checked={formData.hasDoubleOvertime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hasDoubleOvertime: e.target.checked }))}
                                        className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white">Pago Fines de Semana (100%)</span>
                                        <span className="text-xs text-slate-400">Doble sueldo Sáb/Dom/Feriados</span>
                                    </div>
                                </label>
                            </div>
                        </section>

                        {/* Información Bancaria */}
                        <section>
                            <h3 className="text-xl font-semibold text-purple-300 mb-4 border-b border-white/10 pb-2">Información Bancaria</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <SelectField label="Banco" name="bankName" value={formData.bankName} onChange={handleChange}
                                    options={BANK_OPTIONS}
                                />
                                <InputField label="Número de Cuenta" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
                                <SelectField label="Tipo de Cuenta" name="accountType" value={formData.accountType} onChange={handleChange}
                                    options={ACCOUNT_TYPES}
                                />
                            </div>
                        </section>

                        <div className="flex justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="mr-4 px-6 py-2 rounded-lg bg-transparent border border-white/20 hover:bg-white/5 transition-colors text-slate-300 flex items-center"
                            >
                                ← Volver

                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
