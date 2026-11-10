/**
 * @file PublishAnnouncementModal.jsx
 * @description Modal institucional para redacción y publicación oficial de comunicados
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '../../../components/common/Modal';

export const PublishAnnouncementModal = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  actionLoading,
}) => {
  const inputClass =
    'w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publicar Comunicado Oficial"
      size="lg"
    >
      <form onSubmit={onSubmit}>
        <div className="space-y-3.5">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Título del Comunicado</label>
            <input
              type="text"
              required
              placeholder="ej. Actualización de Políticas / Aviso Operativo"
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Categoría</label>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="GENERAL">Aviso General</option>
                <option value="POLICY">Política / Reglamento</option>
                <option value="HOLIDAY">Feriado / Asueto</option>
                <option value="BIRTHDAY">Cumpleaños</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">Baja / Informativa</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Alta / Importante</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Contenido del Comunicado
            </label>
            <textarea
              rows="4"
              required
              placeholder="Escribe el mensaje o disposición para el personal..."
              className={inputClass}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            ></textarea>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={form.requiresAcknowledgment}
                onChange={(e) => setForm({ ...form, requiresAcknowledgment: e.target.checked })}
              />
              <span className="font-medium text-gray-900">
                Exigir Confirmación de Lectura Obligatoria
              </span>
            </label>
            <p className="text-[11px] text-gray-500 pl-6">
              Los colaboradores deberán pulsar el botón de acuse formal para registrar su
              conocimiento legal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Fijar en Tablón Hasta
              </label>
              <input
                type="date"
                className={inputClass}
                value={form.pinnedUntil || ''}
                onChange={(e) => setForm({ ...form, pinnedUntil: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Fecha de Expiración</label>
              <input
                type="date"
                className={inputClass}
                value={form.expiresAt || ''}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Publicando...' : 'Publicar Comunicado'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PublishAnnouncementModal;
