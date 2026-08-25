import React from 'react';
import { InputField, SelectField } from './EmployeeHelpers';
import { CIVIL_STATUS_OPTIONS, ACCOUNT_TYPES, BANK_OPTIONS, DEPARTMENTS } from '../../../constants/employeeOptions';
import Modal from '../../../components/common/Modal';

const EditEmployeeModal = ({ isOpen, onClose, onSave, editForm, onChange, user, employeeIdentityCard, fieldErrors = {} }) => {
    const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'superadmin';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isAdminOrHR ? 'Editar Ficha del Colaborador' : 'Editar Mi Información de Contacto'}
            subtitle={isAdminOrHR 
                ? 'Actualiza los parámetros laborales, contractuales y personales.' 
                : 'Mantén actualizada tu información de contacto personal y domicilio.'}
            size="xl"
        >
            <form onSubmit={onSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Información Personal */}
                        <div className="col-span-1 md:col-span-2">
                            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider pb-1.5 border-b border-gray-100">
                                Información Personal
                            </h4>
                        </div>

                        <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5 font-mono">Cédula / Documento</label>
                            <p className="text-gray-900 font-mono font-medium tabular-nums">{employeeIdentityCard || 'S/N'}</p>
                        </div>

                        {isAdminOrHR ? (
                            <>
                                <InputField label="Nombre" name="firstName" value={editForm.firstName} onChange={onChange} error={fieldErrors.firstName} help="Nombre legal del empleado." />
                                <InputField label="Apellido" name="lastName" value={editForm.lastName} onChange={onChange} error={fieldErrors.lastName} help="Apellidos completos." />
                                <InputField label="Correo Electrónico" name="email" value={editForm.email} onChange={onChange} error={fieldErrors.email} help="Correo corporativo principal." />
                            </>
                        ) : (
                            <>
                                <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">Nombres y Apellidos</label>
                                    <p className="text-gray-900 font-medium">{editForm.firstName} {editForm.lastName}</p>
                                </div>
                                <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5 font-mono">Correo Corporativo</label>
                                    <p className="text-gray-900 font-mono tabular-nums">{editForm.email}</p>
                                </div>
                            </>
                        )}

                        <InputField label="Teléfono de Contacto" name="phone" value={editForm.phone} onChange={onChange} error={fieldErrors.phone} help="Número celular (Ej: 0991234567)." />
                        <InputField label="Dirección Domiciliaria" name="address" value={editForm.address} onChange={onChange} error={fieldErrors.address} help="Dirección domiciliaria actual." />

                        <SelectField
                            label="Estado Civil"
                            name="civilStatus"
                            value={editForm.civilStatus}
                            onChange={onChange}
                            options={CIVIL_STATUS_OPTIONS}
                        />

                        {isAdminOrHR ? (
                            <InputField label="Fecha de Nacimiento" name="birthDate" type="date" value={editForm.birthDate} onChange={onChange} error={fieldErrors.birthDate} />
                        ) : (
                            <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">Fecha de Nacimiento</label>
                                <p className="text-gray-900 font-mono tabular-nums">{editForm.birthDate || 'No registrada'}</p>
                            </div>
                        )}

                        {/* Información Laboral */}
                        <div className="col-span-1 md:col-span-2 mt-2">
                            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider pb-1.5 border-b border-gray-100">
                                Información Laboral y Contractual
                            </h4>
                        </div>

                        {isAdminOrHR ? (
                            <>
                                <SelectField
                                    label="Departamento"
                                    name="department"
                                    value={editForm.department}
                                    onChange={onChange}
                                    options={DEPARTMENTS}
                                />
                                <InputField label="Cargo / Posición" name="position" value={editForm.position} onChange={onChange} error={fieldErrors.position} help="Cargo u ocupación oficial." />
                                <InputField label="Salario Base ($ USD)" name="salary" type="number" value={editForm.salary} onChange={onChange} error={fieldErrors.salary} help="Sueldo base mensual." />
                                <InputField label="Fecha de Ingreso" name="hireDate" type="date" value={editForm.hireDate} onChange={onChange} error={fieldErrors.hireDate} help="Fecha de inicio de labores." />
                            </>
                        ) : (
                            <>
                                <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">Departamento</label>
                                    <p className="text-gray-900 font-medium">{editForm.department}</p>
                                </div>
                                <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">Cargo</label>
                                    <p className="text-gray-900 font-medium">{editForm.position}</p>
                                </div>
                                <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">Salario Base</label>
                                    <p className="text-gray-900 font-mono font-medium">Confidencial</p>
                                </div>
                                <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">Fecha de Ingreso</label>
                                    <p className="text-gray-900 font-mono tabular-nums">{editForm.hireDate || '—'}</p>
                                </div>
                            </>
                        )}

                        {isAdminOrHR && (
                            <div className="col-span-1 md:col-span-2 bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                                <h4 className="text-xs font-semibold text-gray-700">Recargos y Parámetros Legales</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                                        <input
                                            type="checkbox"
                                            name="hasNightSurcharge"
                                            checked={editForm.hasNightSurcharge ?? true}
                                            onChange={(e) => onChange({ target: { name: 'hasNightSurcharge', value: e.target.checked } })}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Aplica Recargo Nocturno (25%)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                                        <input
                                            type="checkbox"
                                            name="hasDoubleOvertime"
                                            checked={editForm.hasDoubleOvertime ?? true}
                                            onChange={(e) => onChange({ target: { name: 'hasDoubleOvertime', value: e.target.checked } })}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Aplica Doble H.E. Fines de Semana</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Información Bancaria */}
                        <div className="col-span-1 md:col-span-2 mt-2">
                            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider pb-1.5 border-b border-gray-100">
                                Datos Bancarios para Nómina
                            </h4>
                        </div>

                        {isAdminOrHR ? (
                            <>
                                <SelectField
                                    label="Institución Bancaria"
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
                            <div className="col-span-1 md:col-span-2 p-3 bg-gray-50 border border-gray-200 rounded text-gray-600 text-xs">
                                Para solicitar cambios de tu cuenta bancaria de nómina, adjunta tu certificado bancario en <strong className="text-gray-800">Mi Expediente Digital</strong> o contacta a RRHH.
                            </div>
                        )}

                        {/* Control de Ubicación y Geocerca (Admin) */}
                        {isAdminOrHR && (
                            <>
                                <div className="col-span-1 md:col-span-2 mt-2">
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider pb-1.5 border-b border-gray-100">
                                        Control de Asistencia Geocercada
                                    </h4>
                                </div>

                                <div className="col-span-1 md:col-span-2 bg-gray-50 p-3 rounded border border-gray-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-800 text-xs">Restringir Marcado por Geocerca</p>
                                            <p className="text-[11px] text-gray-500">Valida que el colaborador marque dentro del radio permitido del sitio de trabajo.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            name="enforceGeofence"
                                            checked={editForm.enforceGeofence || false}
                                            onChange={(e) => onChange({ target: { name: 'enforceGeofence', value: e.target.checked } })}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                        />
                                    </div>

                                    {editForm.enforceGeofence && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                            <InputField
                                                label="Latitud"
                                                name="workLatitude"
                                                type="number"
                                                step="any"
                                                value={editForm.workLatitude}
                                                onChange={onChange}
                                                help="Coordenada de latitud."
                                            />
                                            <InputField
                                                label="Longitud"
                                                name="workLongitude"
                                                type="number"
                                                step="any"
                                                value={editForm.workLongitude}
                                                onChange={onChange}
                                                help="Coordenada de longitud."
                                            />
                                            <InputField
                                                label="Radio (Metros)"
                                                name="geofenceRadius"
                                                type="number"
                                                value={editForm.geofenceRadius || 200}
                                                onChange={onChange}
                                                help="Tolerancia en metros."
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {fieldErrors.dates && (
                            <div className="col-span-1 md:col-span-2 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                                {fieldErrors.dates}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer shadow-xs"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
        </Modal>
    );
};

export default EditEmployeeModal;
