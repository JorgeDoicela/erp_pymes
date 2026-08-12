import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../../hooks/employees/useEmployees';
import { InputField, SelectField } from './components/EmployeeHelpers';
import { CIVIL_STATUS_OPTIONS, CONTRACT_TYPES, ACCOUNT_TYPES, BANK_OPTIONS, DEPARTMENTS, ROLE_OPTIONS } from '../../constants/employeeOptions';
import { validateCedula, validateEmail, validatePhone, validateSalary, validateDates, validateAge } from '../../utils/validationUtils';

const RegisterEmployee = ({ token }) => {
    const navigate = useNavigate();
    const { registerEmployee, loading } = useEmployees(token);
    const [hasSavedData, setHasSavedData] = useState(!!localStorage.getItem('employee_form_autosave'));

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
        role: 'employee',
        bankName: '',
        accountNumber: '',
        accountType: 'Ahorros',
        password: '',
        hasNightSurcharge: true,
        hasDoubleOvertime: true
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };
        setFormData(updatedData);
        localStorage.setItem('employee_form_autosave', JSON.stringify(updatedData));
        if (fieldErrors[name]) {
            setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }
    };

    const recoverData = () => {
        const saved = localStorage.getItem('employee_form_autosave');
        if (saved) {
            try {
                setFormData(JSON.parse(saved));
                toast.success('Datos recuperados de la sesión anterior');
            } catch (e) {
                console.error('Error al recuperar autosave', e);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const errors = {};
        const cedulaErr = validateCedula(formData.identityCard);
        if (cedulaErr) errors.identityCard = cedulaErr;
        const emailErr = validateEmail(formData.email);
        if (emailErr) errors.email = emailErr;
        const phoneErr = validatePhone(formData.phone);
        if (phoneErr) errors.phone = phoneErr;
        const salaryErr = validateSalary(formData.salary);
        if (salaryErr) errors.salary = salaryErr;
        const ageErr = validateAge(formData.birthDate);
        if (ageErr) errors.birthDate = ageErr;
        if (!formData.password || formData.password.length < 8) {
            errors.password = 'La contraseña debe tener al menos 8 caracteres';
        }
        const dateErr = validateDates(formData.birthDate, formData.hireDate);
        if (dateErr) errors.dates = dateErr;
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Por favor corrija los errores en el formulario');
            toast.error('Datos del formulario inválidos');
            return;
        }
        try {
            await registerEmployee({ ...formData, salary: Number(formData.salary) });
            localStorage.removeItem('employee_form_autosave');
            toast.success('Empleado registrado exitosamente');
            navigate('/admin/employees');
        } catch (err) {
            setError(err.message || 'Error al registrar empleado');
            toast.error(err.message || 'Error al registrar empleado');
        }
    };

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Recursos Humanos · Alta de Personal</p>
                    <h1 className="text-xl font-semibold text-gray-900">Registro de Nuevo Colaborador</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Complete el formulario para incorporar un nuevo empleado al sistema.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                >
                    ← Volver
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
            )}

            {hasSavedData && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex justify-between items-center">
                    <span>Hay un borrador guardado de la sesión anterior.</span>
                    <button
                        onClick={() => { recoverData(); setHasSavedData(false); }}
                        className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Recuperar
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Personal */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Información Personal</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InputField label="Nombre" name="firstName" value={formData.firstName} onChange={handleChange} />
                        <InputField label="Apellido" name="lastName" value={formData.lastName} onChange={handleChange} />
                        <InputField label="Cédula" name="identityCard" value={formData.identityCard} onChange={handleChange} error={fieldErrors.identityCard} />
                        <InputField label="Fecha de Nacimiento" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} error={fieldErrors.birthDate} />
                        <SelectField label="Estado Civil" name="civilStatus" value={formData.civilStatus} onChange={handleChange} options={CIVIL_STATUS_OPTIONS} />
                        <InputField label="Dirección" name="address" value={formData.address} onChange={handleChange} />
                        <InputField label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} error={fieldErrors.phone} />
                        <InputField label="Email Personal" name="email" type="email" value={formData.email} onChange={handleChange} error={fieldErrors.email} />
                    </div>
                    {fieldErrors.dates && (
                        <div className="px-4 pb-3">
                            <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100">{fieldErrors.dates}</p>
                        </div>
                    )}
                </div>

                {/* Información Laboral */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Información Laboral</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SelectField label="Departamento" name="department" value={formData.department} onChange={handleChange} options={DEPARTMENTS} />
                        <InputField label="Cargo" name="position" value={formData.position} onChange={handleChange} />
                        <InputField label="Fecha de Ingreso" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} />
                        <SelectField label="Tipo de Contrato" name="contractType" value={formData.contractType} onChange={handleChange} options={CONTRACT_TYPES} />
                        <InputField label="Salario Base ($)" name="salary" type="number" min="0" step="0.01" value={formData.salary} onChange={handleChange} error={fieldErrors.salary} />
                        <SelectField label="Rol en el Sistema" name="role" value={formData.role} onChange={handleChange} options={ROLE_OPTIONS} />
                        <InputField label="Contraseña Inicial" name="password" type="password" value={formData.password} onChange={handleChange} error={fieldErrors.password} help="Mínimo 8 caracteres" />
                    </div>

                    {/* Configuración Legal Ecuador */}
                    <div className="px-4 pb-4">
                        <div className="bg-gray-50 border border-gray-200 rounded p-4">
                            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Configuración Laboral (Ecuador)</h4>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="hasNightSurcharge"
                                        checked={formData.hasNightSurcharge}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hasNightSurcharge: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white"
                                    />
                                    <div>
                                        <span className="text-xs font-medium text-gray-800">Recargo Nocturno (25%)</span>
                                        <span className="text-[11px] text-gray-400 ml-2">19:00 a 06:00</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="hasDoubleOvertime"
                                        checked={formData.hasDoubleOvertime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hasDoubleOvertime: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white"
                                    />
                                    <div>
                                        <span className="text-xs font-medium text-gray-800">Doble en Fin de Semana (100%)</span>
                                        <span className="text-[11px] text-gray-400 ml-2">Sáb/Dom/Feriados</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información Bancaria */}
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Información Bancaria</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SelectField label="Banco" name="bankName" value={formData.bankName} onChange={handleChange} options={BANK_OPTIONS} />
                        <InputField label="Número de Cuenta" name="accountNumber" value={formData.accountNumber} onChange={handleChange} help="Para el depósito de nómina" />
                        <SelectField label="Tipo de Cuenta" name="accountType" value={formData.accountType} onChange={handleChange} options={ACCOUNT_TYPES} />
                    </div>
                </div>

                {/* Footer de acciones */}
                <div className="flex justify-end items-center gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Registrando...' : 'Registrar Empleado'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterEmployee;
