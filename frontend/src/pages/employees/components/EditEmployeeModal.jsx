import React from 'react';
import { InputField, SelectField } from './EmployeeHelpers';
import { CIVIL_STATUS_OPTIONS, ACCOUNT_TYPES, BANK_OPTIONS, DEPARTMENTS } from '../../../constants/employeeOptions';

const EditEmployeeModal = ({ isOpen, onClose, onSave, editForm, onChange, user, employeeIdentityCard, fieldErrors = {} }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Editar Empleado</h2>
                <form onSubmit={onSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Información Personal */}
                        <div className="col-span-1 md:col-span-2">
                            <h4 className="text-emerald-400 font-semibold mb-4 border-b border-white/10 pb-2">Información Personal</h4>
                        </div>

                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 opacity-70">
                            <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Cédula</label>
                            <p className="text-slate-300">{employeeIdentityCard}</p>
                        </div>
                        <InputField label="Nombre" name="firstName" value={editForm.firstName} onChange={onChange} error={fieldErrors.firstName} help="Nombre legal del empleado." />
                        <InputField label="Apellido" name="lastName" value={editForm.lastName} onChange={onChange} error={fieldErrors.lastName} help="Apellidos completos." />
                        {user?.role === 'admin' ? (
                            <InputField label="Email" name="email" value={editForm.email} onChange={onChange} error={fieldErrors.email} help="Correo corporativo principal." />
                        ) : (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 opacity-70">
                                <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Email</label>
                                <p className="text-slate-300">{editForm.email}</p>
                            </div>
                        )}
                        <InputField label="Teléfono" name="phone" value={editForm.phone} onChange={onChange} error={fieldErrors.phone} help="Número de contacto (Ej: 0991234567)." />
                        <InputField label="Dirección" name="address" value={editForm.address} onChange={onChange} error={fieldErrors.address} help="Dirección domiciliaria actual." />

                        <SelectField
                            label="Estado Civil"
                            name="civilStatus"
                            value={editForm.civilStatus}
                            onChange={onChange}
                            options={CIVIL_STATUS_OPTIONS}
                        />

                        {user?.role === 'admin' ? (
                            <InputField label="Fecha de Nacimiento" name="birthDate" type="date" value={editForm.birthDate} onChange={onChange} error={fieldErrors.birthDate} />
                        ) : (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 opacity-70">
                                <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Fecha de Nacimiento</label>
                                <p className="text-slate-300">{editForm.birthDate}</p>
                            </div>
                        )}

                        {/* Información Laboral */}
                        <div className="col-span-1 md:col-span-2 mt-4">
                            <h4 className="text-emerald-400 font-semibold mb-4 border-b border-white/10 pb-2">Información Laboral</h4>
                        </div>

                        {user?.role === 'admin' ? (
                            <>
                                {/* Department as Select or Input? Was InputField, switching to Select for consistency with Register but using standard select for this modal structure */}
                                <SelectField
                                    label="Departamento"
                                    name="department"
                                    value={editForm.department}
                                    onChange={onChange}
                                    options={DEPARTMENTS}
                                />
                                <InputField label="Cargo" name="position" value={editForm.position} onChange={onChange} error={fieldErrors.position} help="Cargo u ocupación oficial." />
                                <InputField label="Salario" name="salary" type="number" value={editForm.salary} onChange={onChange} error={fieldErrors.salary} help="Sueldo base mensual." />
                                <InputField label="Fecha de Ingreso" name="hireDate" type="date" value={editForm.hireDate} onChange={onChange} error={fieldErrors.hireDate} help="Fecha de inicio de labores." />
                            </>
                        ) : (
                            <>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 opacity-70">
                                    <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Departamento</label>
                                    <p className="text-slate-300">{editForm.department}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 opacity-70">
                                    <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Cargo</label>
                                    <p className="text-slate-300">{editForm.position}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 opacity-70">
                                    <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Salario</label>
                                    <p className="text-slate-300">*********</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 opacity-70">
                                    <label className="text-xs text-slate-500 uppercase font-semibold block mb-1">Fecha de Ingreso</label>
                                    <p className="text-slate-300">{editForm.hireDate}</p>
                                </div>
                            </>
                        )}

                        {user?.role === 'admin' && (
                            <div className="col-span-1 md:col-span-2 mt-4 bg-slate-900/40 p-4 rounded-lg border border-white/5">
                                <h4 className="text-sm font-semibold text-slate-300 mb-3">Configuración Legal</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="hasNightSurcharge"
                                            checked={editForm.hasNightSurcharge ?? true}
                                            onChange={(e) => onChange({ target: { name: 'hasNightSurcharge', value: e.target.checked } })}
                                            className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                                        />
                                        <span className="text-sm text-slate-300">Aplica Recargo Nocturno (25%)</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="hasDoubleOvertime"
                                            checked={editForm.hasDoubleOvertime ?? true}
                                            onChange={(e) => onChange({ target: { name: 'hasDoubleOvertime', value: e.target.checked } })}
                                            className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                                        />
                                        <span className="text-sm text-slate-300">Aplica Doble h.e. Fines de Semana</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-400">Tipo de Contrato</label>
                            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-2.5 text-slate-400 text-sm">
                                {editForm.contractType === 'permanent' ? 'Indefinido' :
                                    editForm.contractType === 'fixed' ? 'Plazo Fijo' :
                                        editForm.contractType === 'contractor' ? 'Prestación de Servicios' : editForm.contractType}
                                {user?.role === 'admin' && (
                                    <span className="block text-xs text-yellow-500/50 mt-1">* Gestionar desde pestaña Contratos</span>
                                )}
                            </div>
                        </div>

                        {/* Información Bancaria */}
                        <div className="col-span-1 md:col-span-2 mt-4">
                            <h4 className="text-emerald-400 font-semibold mb-4 border-b border-white/10 pb-2">Información Bancaria</h4>
                        </div>

                        {user?.role === 'admin' ? (
                            <>
                                <SelectField
                                    label="Banco"
                                    name="bankName"
                                    value={editForm.bankName}
                                    onChange={onChange}
                                    options={BANK_OPTIONS}
                                />
                                <InputField label="Número de Cuenta" name="accountNumber" value={editForm.accountNumber} onChange={onChange} error={fieldErrors.accountNumber} help="Cuenta para depósito de nómina." />

                                <SelectField
                                    label="Tipo de Cuenta"
                                    name="accountType"
                                    value={editForm.accountType}
                                    onChange={onChange}
                                    options={ACCOUNT_TYPES}
                                />
                            </>
                        ) : (
                            <div className="col-span-1 md:col-span-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p className="text-blue-200 text-sm">Para actualizar datos bancarios, contacte a Recursos Humanos.</p>
                            </div>
                        )}

                        {fieldErrors.dates && (
                            <div className="col-span-1 md:col-span-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-xs">
                                {fieldErrors.dates}
                            </div>
                        )}

                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5">Cancelar</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div >
    );
};

export default EditEmployeeModal;
