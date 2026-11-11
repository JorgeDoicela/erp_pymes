/**
 * @file EmployeeProfile.jsx
 * @description Expediente integral 360° del colaborador, contratos, documentos, historial y datos laborales.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getEmployeeById,
  getEmployees,
  updateEmployee,
  getEmployeeHistory,
  getContracts,
  uploadDocument,
  getDocuments,
  deleteDocument,
  getProfile,
  terminateEmployee,
} from '../services/employee.service';
import EditEmployeeModal from '../components/EditEmployeeModal';
import SkillsTab from '../components/SkillsTab';
import ContractsTab from '../components/ContractsTab';
import { BiometricSettings } from '@modules/attendance';
import Modal from '@core/ui/Modal';
import {
  validateEmail,
  validatePhone,
  validateSalary,
  validateDates,
} from '@core/utils/validationUtils';
import { isSuperAdmin as checkIsSuperAdmin } from '@core/constants/roles';

// Componentes modulares desacoplados del dominio employees
import SuperAdminProfileView from '@/modules/employees/components/SuperAdminProfileView';
import EmployeeProfileHeader from '@/modules/employees/components/EmployeeProfileHeader';
import PersonalInfoTab from '@/modules/employees/components/PersonalInfoTab';
import JobInfoTab from '@/modules/employees/components/JobInfoTab';
import DocumentsTab from '@/modules/employees/components/DocumentsTab';
import WorkHistoryTab from '@/modules/employees/components/WorkHistoryTab';
import TerminateEmployeeModal from '@/modules/employees/components/TerminateEmployeeModal';

const EmployeeProfile = ({ token, user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [history, setHistory] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [documentForm, setDocumentForm] = useState({
    type: 'DNI',
    file: null,
    expiryDate: '',
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [notification, setNotification] = useState(null);

  // Modal de Baja de Colaborador
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [terminateForm, setTerminateForm] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    exitReason: 'Renuncia Voluntaria',
    exitType: 'Voluntary',
    notes: '',
  });
  const [isTerminating, setIsTerminating] = useState(false);

  // Modal de Confirmación para Eliminar Documento
  const [docToDelete, setDocToDelete] = useState(null);

  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (isAdminOrHR && token && id) {
      getEmployees(token)
        .then((res) => {
          const list = res?.data?.employees || res?.data || [];
          if (Array.isArray(list)) {
            setEmployeesList(list);
          }
        })
        .catch(console.error);
    }
  }, [isAdminOrHR, token, id]);

  const fetchEmployee = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      let data;
      if (id) {
        data = await getEmployeeById(id.trim(), token);
      } else {
        data = await getProfile(token);
      }

      if (data && data.data) {
        setEmployee(data.data);
        if (data.data.contracts) setContracts(data.data.contracts);
        if (data.data.documents) setDocuments(data.data.documents);
        if (data.data.workHistory) setHistory(data.data.workHistory);
      } else if (data && (data.isSuperAdmin || checkIsSuperAdmin(user))) {
        setEmployee(null);
      } else {
        showNotification('error', 'No se pudo cargar la información del perfil');
      }
    } catch (err) {
      console.error('Profile Error:', err);
      showNotification('error', err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [id, token, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchEmployee();
  }, [fetchEmployee]);

  const targetEmployeeId = id || employee?.id;

  const fetchHistory = useCallback(async () => {
    if (!targetEmployeeId) return;
    try {
      const data = await getEmployeeHistory(targetEmployeeId, token);
      setHistory(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [targetEmployeeId, token]);

  const fetchContracts = useCallback(async () => {
    if (!targetEmployeeId) return;
    try {
      const data = await getContracts(targetEmployeeId, token);
      setContracts(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [targetEmployeeId, token]);

  const fetchDocuments = useCallback(async () => {
    if (!targetEmployeeId) return;
    try {
      const data = await getDocuments(targetEmployeeId, token);
      setDocuments(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [targetEmployeeId, token]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    else if (activeTab === 'contracts') fetchContracts();
    else if (activeTab === 'documents') fetchDocuments();
  }, [activeTab, fetchHistory, fetchContracts, fetchDocuments]);

  const handleDocumentChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      const file = files[0];
      if (file && file.size > 4 * 1024 * 1024) {
        showNotification('error', 'El archivo supera el límite permitido de 4MB.');
        e.target.value = null;
        setDocumentForm((prev) => ({ ...prev, [name]: null }));
        return;
      }
      setDocumentForm((prev) => ({ ...prev, [name]: file }));
    } else {
      setDocumentForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!documentForm.file) return showNotification('error', 'Seleccione un archivo');

    const targetId = id || employee?.id;
    const formData = new FormData();
    formData.append('employeeId', targetId);
    formData.append('type', documentForm.type);
    formData.append('document', documentForm.file);
    if (documentForm.expiryDate) formData.append('expiryDate', documentForm.expiryDate);

    setIsUploading(true);
    try {
      await uploadDocument(formData, token);
      await fetchDocuments();
      setIsUploading(false);
      setDocumentForm({ type: 'DNI', file: null, expiryDate: '' });
      showNotification('success', 'Documento subido correctamente');
    } catch (err) {
      showNotification('error', err.message || 'Error al subir documento');
      setIsUploading(false);
    }
  };

  const handleConfirmDeleteDoc = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete, token);
      await fetchDocuments();
      setDocToDelete(null);
      showNotification('success', 'Documento eliminado correctamente');
    } catch (err) {
      showNotification('error', err.message || 'Error al eliminar documento');
    }
  };

  const handleAddSkillLocal = (newSkill) => {
    setEmployee((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), newSkill],
    }));
  };

  const handleDeleteSkillLocal = (skillId) => {
    setEmployee((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== skillId),
    }));
  };

  const handleEditClick = () => {
    setEditForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      department: employee.department,
      position: employee.position,
      salary: employee.salary,
      civilStatus: employee.civilStatus,
      birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '',
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
      contractType: employee.contractType,
      hasNightSurcharge:
        employee.contracts?.find((c) => c.status === 'Active')?.hasNightSurcharge ?? true,
      hasDoubleOvertime:
        employee.contracts?.find((c) => c.status === 'Active')?.hasDoubleOvertime ?? true,
      bankName: employee.bankName || '',
      accountNumber: employee.accountNumber || '',
      accountType: employee.accountType || 'Ahorros',
      workLatitude: employee.workLatitude || '',
      workLongitude: employee.workLongitude || '',
      geofenceRadius: employee.geofenceRadius || 200,
      enforceGeofence: employee.enforceGeofence || false,
    });
    setFieldErrors({});
    setIsEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (user?.role === 'admin') {
      const emailErr = validateEmail(editForm.email);
      if (emailErr) errors.email = emailErr;

      const salaryErr = validateSalary(editForm.salary);
      if (salaryErr) errors.salary = salaryErr;

      const dateErr = validateDates(editForm.birthDate, editForm.hireDate);
      if (dateErr) errors.dates = dateErr;
    }

    const phoneErr = validatePhone(editForm.phone);
    if (phoneErr) errors.phone = phoneErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showNotification('error', 'Por favor corrija los errores en el formulario');
      return;
    }

    try {
      const targetId = id || employee?.id;
      await updateEmployee(
        targetId,
        {
          ...editForm,
          salary: Number(editForm.salary),
          birthDate: new Date(editForm.birthDate),
          hireDate: new Date(editForm.hireDate),
        },
        token
      );
      await fetchEmployee();
      setIsEditing(false);
      if (activeTab === 'history') fetchHistory();
      showNotification('success', 'Perfil actualizado correctamente');
    } catch (err) {
      showNotification('error', err.message || 'Error al actualizar perfil');
    }
  };

  const handleTerminateSubmit = async (e) => {
    e.preventDefault();
    setIsTerminating(true);
    try {
      await terminateEmployee(
        employee.id,
        {
          exitDate: new Date(terminateForm.exitDate),
          exitReason:
            terminateForm.exitReason + (terminateForm.notes ? `: ${terminateForm.notes}` : ''),
          exitType: terminateForm.exitType,
        },
        token
      );
      setIsTerminateOpen(false);
      showNotification('success', 'Empleado dado de baja exitosamente');
      await fetchEmployee();
    } catch (err) {
      showNotification('error', err.message || 'Error al procesar la baja');
    } finally {
      setIsTerminating(false);
    }
  };

  if (loading)
    return <div className="p-12 text-center text-gray-400 text-xs">Cargando perfil...</div>;

  const isSuperAdminUser = checkIsSuperAdmin(user);

  if (!employee && isSuperAdminUser) {
    return <SuperAdminProfileView user={user} />;
  }

  if (!employee)
    return <div className="p-12 text-center text-gray-400 text-xs">Colaborador no encontrado</div>;

  const tabs = [
    { id: 'personal', label: 'Información Personal' },
    { id: 'job', label: 'Datos Laborales' },
    { id: 'contracts', label: 'Contratos', count: contracts.length },
    { id: 'documents', label: 'Documentos', count: documents.length },
    { id: 'history', label: 'Historial', count: history.length },
    { id: 'skills', label: 'Habilidades', count: employee.skills?.length || 0 },
    (!id || id === user?.id) && { id: 'security', label: 'Seguridad' },
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Notificación Toast Sobria */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-[4px] border text-xs font-medium shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header ERP con Balance Operativo */}
      <EmployeeProfileHeader
        employee={employee}
        id={id}
        user={user}
        isAdminOrHR={isAdminOrHR}
        employeesList={employeesList}
        onEditClick={handleEditClick}
        onTerminateClick={() => setIsTerminateOpen(true)}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Contenido de la Pestaña Activa */}
      <div className="bg-white rounded-[4px] p-5 border border-gray-200 min-h-[350px]">
        {activeTab === 'personal' && <PersonalInfoTab employee={employee} />}

        {activeTab === 'job' && <JobInfoTab employee={employee} />}

        {activeTab === 'contracts' && (
          <ContractsTab
            contracts={contracts}
            user={user}
            employeeId={employee.id}
            token={token}
            onUpdate={fetchContracts}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab
            documents={documents}
            documentForm={documentForm}
            handleDocumentChange={handleDocumentChange}
            handleUploadDocument={handleUploadDocument}
            isUploading={isUploading}
            setDocToDelete={setDocToDelete}
          />
        )}

        {activeTab === 'history' && <WorkHistoryTab history={history} />}

        {activeTab === 'skills' && (
          <SkillsTab
            skills={employee.skills}
            user={user}
            employeeId={employee.id}
            token={token}
            onUpdate={fetchEmployee}
            onAddSkill={handleAddSkillLocal}
            onDeleteSkill={handleDeleteSkillLocal}
          />
        )}

        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto">
            <BiometricSettings />
          </div>
        )}
      </div>

      {/* Modal de Edición de Perfil */}
      <EditEmployeeModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveEdit}
        editForm={editForm}
        onChange={handleEditChange}
        user={user}
        employeeIdentityCard={employee.identityCard}
        fieldErrors={fieldErrors}
      />

      {/* Modal Sobrio de Baja de Colaborador */}
      <TerminateEmployeeModal
        isOpen={isTerminateOpen}
        onClose={() => setIsTerminateOpen(false)}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        terminateForm={terminateForm}
        setTerminateForm={setTerminateForm}
        onSubmit={handleTerminateSubmit}
        isTerminating={isTerminating}
      />

      {/* Modal de Confirmación para Eliminar Documento */}
      <Modal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        title="¿Eliminar documento adjunto?"
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setDocToDelete(null)}
              className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 rounded-[4px] text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteDoc}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-[4px] text-xs font-medium transition-colors cursor-pointer"
            >
              Eliminar
            </button>
          </div>
        }
      >
        <p className="text-gray-500 text-xs">
          Esta acción eliminará el archivo del expediente digital del colaborador.
        </p>
      </Modal>
    </div>
  );
};

export default EmployeeProfile;
