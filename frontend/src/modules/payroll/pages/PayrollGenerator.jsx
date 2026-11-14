/**
 * @file PayrollGenerator.jsx
 * @description Orquestador modular del Generador de Nómina Legal y Liquidaciones PyME
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiBell } from 'react-icons/fi';
import { canMutatePayroll, getCurrentUser } from '@core/constants/roles';
import { Button } from '@core/ui';
import GeneratePayrollModal from '../components/GeneratePayrollModal.jsx';
import EditPayrollDetailModal from '../components/EditPayrollDetailModal.jsx';
import { ConfirmActionModal } from '@/modules/payroll/components/ConfirmActionModal.jsx';
import { PayrollDetailsTable } from '@/modules/payroll/components/PayrollDetailsTable.jsx';
import {
  PAYROLL_STATUS_MAP,
  PayrollHistoryTable,
} from '@/modules/payroll/components/PayrollHistoryTable.jsx';
import { usePayrollGenerator } from '../hooks/usePayrollGenerator';

const PayrollGenerator = ({ user }) => {
  const currentUser = user || getCurrentUser();
  const canMutate = canMutatePayroll(currentUser);
  const {
    payrolls,
    loading,
    error,
    generating,
    selectedPayroll,
    setSelectedPayroll,
    searchTerm,
    setSearchTerm,
    modalOpen,
    setModalOpen,
    genParams,
    setGenParams,
    editModalOpen,
    setEditModalOpen,
    editingDetail,
    setEditingDetail,
    confirmDialog,
    setConfirmDialog,
    filteredDetails,
    signatureStats,
    loadHistory,
    viewDetail,
    handleGenerate,
    handleConfirmPayroll,
    handleDownloadBankFile,
    handleMarkAsPaid,
    handleDeletePayroll,
    handleIntegrateAccounting,
    handleNotifySignatures,
    handleUpdateDetail,
  } = usePayrollGenerator();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Nómina y Liquidaciones
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Cálculo legal bajo Código del Trabajo e IESS (Ecuador) · Aportes 9.45% / 11.15% · Horas
            extra y finiquitos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPayroll && (
            <Button variant="secondary" onClick={() => setSelectedPayroll(null)}>
              ← Historial de Nóminas
            </Button>
          )}
          {canMutate ? (
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              + Nueva Nómina
            </Button>
          ) : (
            <span className="text-xs text-gray-500 font-mono border border-gray-200 px-3 py-1.5 rounded-[4px] bg-gray-50">
              Solo Lectura / Auditoría
            </span>
          )}
        </div>
      </div>

      {!selectedPayroll ? (
        <PayrollHistoryTable
          payrolls={payrolls}
          loading={loading}
          error={error}
          onRetry={loadHistory}
          onViewDetail={viewDetail}
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-[4px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">
                  Nómina: {selectedPayroll.period}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    PAYROLL_STATUS_MAP[selectedPayroll.status]?.cls
                  }`}
                >
                  {PAYROLL_STATUS_MAP[selectedPayroll.status]?.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-mono tabular-nums">
                {selectedPayroll.totalEmployees} empleados · Total Neto: $
                {Number(selectedPayroll.totalNet || 0).toFixed(2)} · Aporte Patronal IESS: $
                {Number(selectedPayroll.totalEmployerIess || 0).toFixed(2)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedPayroll.status === 'DRAFT' && canMutate && (
                <>
                  <Button variant="destructive" onClick={handleDeletePayroll}>
                    Eliminar
                  </Button>
                  <Button variant="primary" onClick={handleConfirmPayroll}>
                    Aprobar Nómina
                  </Button>
                </>
              )}

              {selectedPayroll.status === 'APPROVED' && (
                <>
                  <Button variant="secondary" onClick={handleDownloadBankFile}>
                    Descargar Archivo Banco
                  </Button>
                  {canMutate && !selectedPayroll.journalEntryId && (
                    <Button variant="secondary" onClick={handleIntegrateAccounting}>
                      Integrar Contabilidad
                    </Button>
                  )}
                  {canMutate && (
                    <Button variant="primary" onClick={handleMarkAsPaid}>
                      Registrar Pago
                    </Button>
                  )}
                </>
              )}

              {selectedPayroll.status === 'PAID' && (
                <>
                  <Button variant="secondary" onClick={handleDownloadBankFile}>
                    Descargar Archivo Banco
                  </Button>
                  {canMutate && !selectedPayroll.journalEntryId && (
                    <Button variant="secondary" onClick={handleIntegrateAccounting}>
                      Integrar Contabilidad
                    </Button>
                  )}
                  {canMutate && signatureStats.pending > 0 && (
                    <Button variant="secondary" icon={FiBell} onClick={handleNotifySignatures}>
                      Notificar Firmas ({signatureStats.pending})
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
            <div className="p-3.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-72 bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-gray-400 font-mono tabular-nums">
                Mostrando {filteredDetails.length} de {selectedPayroll.details?.length || 0}{' '}
                colaboradores
              </span>
            </div>

            <PayrollDetailsTable
              payroll={selectedPayroll}
              details={filteredDetails}
              readOnly={!canMutate}
              onEditDetail={(det) => {
                setEditingDetail({ ...det });
                setEditModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      <GeneratePayrollModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleGenerate}
        params={genParams}
        setParams={setGenParams}
        generating={generating}
      />

      <EditPayrollDetailModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editingDetail={editingDetail}
        setEditingDetail={setEditingDetail}
        onSubmit={handleUpdateDetail}
      />

      <ConfirmActionModal
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
      />
    </div>
  );
};

export default PayrollGenerator;
