import React from 'react';
import { InputField, SelectField } from './EmployeeHelpers';
import { CIVIL_STATUS_OPTIONS, ACCOUNT_TYPES, BANK_OPTIONS, DEPARTMENTS } from '../../../constants/employeeOptions';

const EditEmployeeModal = ({ isOpen, onClose, onSave, editForm, onChange, user, employeeIdentityCard, fieldErrors = {} }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-slate-800">
                    {user?.id === editForm.id ? 'Editar mi Perfil' :
                        (editForm.role === 'admin' ? 'Editar Administrador' : 'Editar Empleado')}
                </h2>
                <form onSubmit={onSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Información Personal */}
                        <div className="col-span-1 md:col-span-2">
                            <h4 className="text-emerald-600 font-semibold mb-4 border-b border-slate-200 pb-2">Información Personal</h4>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Cédula</label>
                            <p className="text-slate-800 font-medium">{employeeIdentityCard}</p>
                        </div>
                        <InputField label="Nombre" name="firstName" value={editForm.firstName} onChange={onChange} error={fieldErrors.firstName} help="Nombre legal del empleado." />
                        <InputField label="Apellido" name="lastName" value={editForm.lastName} onChange={onChange} error={fieldErrors.lastName} help="Apellidos completos." />
                        {user?.role === 'admin' ? (
                            <InputField label="Email" name="email" value={editForm.email} onChange={onChange} error={fieldErrors.email} help="Correo corporativo principal." />
                        ) : (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Email</label>
                                <p className="text-slate-800 font-medium">{editForm.email}</p>
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
                            <h4 className="text-emerald-600 font-semibold mb-4 border-b border-slate-200 pb-2">Información Laboral</h4>
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
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Departamento</label>
                                    <p className="text-slate-800 font-medium">{editForm.department}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Cargo</label>
                                    <p className="text-slate-800 font-medium">{editForm.position}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Salario</label>
                                    <p className="text-slate-800 font-medium">*********</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Fecha de Ingreso</label>
                                    <p className="text-slate-800 font-medium">{editForm.hireDate}</p>
                                </div>
                            </>
                        )}

                        {user?.role === 'admin' && (
                            <div className="col-span-1 md:col-span-2 mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Configuración Legal</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="hasNightSurcharge"
                                            checked={editForm.hasNightSurcharge ?? true}
                                            onChange={(e) => onChange({ target: { name: 'hasNightSurcharge', value: e.target.checked } })}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                                        />
                                        <span className="text-sm text-slate-600">Aplica Recargo Nocturno (25%)</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="hasDoubleOvertime"
                                            checked={editForm.hasDoubleOvertime ?? true}
                                            onChange={(e) => onChange({ target: { name: 'hasDoubleOvertime', value: e.target.checked } })}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                                        />
                                        <span className="text-sm text-slate-600">Aplica Doble h.e. Fines de Semana</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Tipo de Contrato</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-600 text-sm font-medium">
                                {editForm.contractType === 'permanent' ? 'Indefinido' :
                                    editForm.contractType === 'fixed' ? 'Plazo Fijo' :
                                        editForm.contractType === 'contractor' ? 'Prestación de Servicios' : editForm.contractType}
                                {user?.role === 'admin' && (
                                    <span className="block text-xs text-amber-600 mt-1">* Gestionar desde pestaña Contratos</span>
                                )}
                            </div>
                        </div>

                        {/* Información Bancaria */}
                        <div className="col-span-1 md:col-span-2 mt-4">
                            <h4 className="text-emerald-600 font-semibold mb-4 border-b border-slate-200 pb-2">Información Bancaria</h4>
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
                            <div className="col-span-1 md:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-blue-700 text-sm">Para actualizar datos bancarios, contacte a Recursos Humanos.</p>
                            </div>
                        )}

                        {/* Control de Ubicación (Geocerca) */}
                        {user?.role === 'admin' && (
                            <>
                                <div className="col-span-1 md:col-span-2 mt-4">
                                    <h4 className="text-blue-600 font-semibold mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Control de Ubicación (Geocerca)
                                    </h4>
                                </div>

                                <div className="col-span-1 md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm italic">Restringir Marcado por Ubicación</p>
                                            <p className="text-xs text-slate-500">Si se activa, el empleado solo podrá marcar asistencia dentro del radio permitido.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="enforceGeofence"
                                                checked={editForm.enforceGeofence || false}
                                                onChange={(e) => onChange({ target: { name: 'enforceGeofence', value: e.target.checked } })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {editForm.enforceGeofence && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <InputField
                                                label="Latitud"
                                                name="workLatitude"
                                                type="number"
                                                step="any"
                                                value={editForm.workLatitude}
                                                onChange={onChange}
                                                help="Coordenada Y del sitio de trabajo."
                                            />
                                            <InputField
                                                label="Longitud"
                                                name="workLongitude"
                                                type="number"
                                                step="any"
                                                value={editForm.workLongitude}
                                                onChange={onChange}
                                                help="Coordenada X del sitio de trabajo."
                                            />
                                            <InputField
                                                label="Radio (Metros)"
                                                name="geofenceRadius"
                                                type="number"
                                                value={editForm.geofenceRadius || 200}
                                                onChange={onChange}
                                                help="Margen de error permitido."
                                            />
                                            <div className="col-span-1 md:col-span-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (navigator.geolocation) {
                                                            navigator.geolocation.getCurrentPosition((pos) => {
                                                                onChange({ target: { name: 'workLatitude', value: pos.coords.latitude } });
                                                                onChange({ target: { name: 'workLongitude', value: pos.coords.longitude } });
                                                            }, (err) => alert("Error al obtener ubicación: " + err.message));
                                                        } else {
                                                            alert("Geolocalización no soportada en este navegador");
                                                        }
                                                    }}
                                                    className="w-full text-xs bg-white border border-blue-200 text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    Usar mi ubicación actual como punto central
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {fieldErrors.dates && (
                            <div className="col-span-1 md:col-span-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs">
                                {fieldErrors.dates}
                            </div>
                        )}

                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">Cancelar</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div >
    );
};

export default EditEmployeeModal;
