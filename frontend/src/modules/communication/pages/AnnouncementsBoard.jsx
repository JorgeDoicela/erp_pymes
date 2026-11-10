/**
 * @file AnnouncementsBoard.jsx
 * @description Norma ERP - Tablón Oficial de Anuncios y Comunicados Institucionales
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect } from 'react';
import {
  getAnnouncements,
  getBoardStats,
  createAnnouncement,
  markAnnouncementReadOrAcknowledge,
  getAnnouncementStats,
  deleteAnnouncement,
  getBirthdays,
} from '../../../services/communication/announcement.service';
import {
  AnnouncementsFeed,
  AnnouncementsBirthdaysTab,
  AnnouncementsSidebar,
  PublishAnnouncementModal,
  AnnouncementReadStatsModal,
  ConfirmDeleteAnnouncementModal,
} from '../components';

const AnnouncementsBoard = ({ user }) => {
  // Estados principales
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    policyCount: 0,
    holidayCount: 0,
    birthdayCount: 0,
    pendingAcknowledgmentCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Navegación de pestañas: 'ALL', 'POLICY', 'HOLIDAY', 'BIRTHDAYS', 'PENDING_ACK'
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales y acciones
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Formulario de publicación
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    requiresAcknowledgment: false,
    attachmentUrl: '',
    pinnedUntil: '',
    expiresAt: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    window.scrollTo(0, 0);
    loadBoardStats();
    loadBirthdays();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadBoardStats = async () => {
    try {
      const res = await getBoardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas del tablón:', error);
    }
  };

  const loadBirthdays = async () => {
    try {
      const res = await getBirthdays();
      if (res.success && Array.isArray(res.data)) {
        setBirthdays(res.data);
      }
    } catch (error) {
      console.error('Error cargando cumpleaños:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm.trim() || undefined,
      };

      if (activeTab === 'POLICY') params.category = 'POLICY';
      else if (activeTab === 'HOLIDAY') params.category = 'HOLIDAY';
      else if (activeTab === 'PENDING_ACK') params.pendingOnly = true;

      const res = await getAnnouncements(params);
      if (res.success && Array.isArray(res.data)) {
        setAnnouncements(res.data);
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al cargar comunicados');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      showNotification('error', 'Proporcione el título y contenido del comunicado');
      return;
    }
    setActionLoading(true);
    try {
      const res = await createAnnouncement(form);
      if (res.success) {
        showNotification('success', 'Comunicado oficial publicado exitosamente');
        setCreateModalOpen(false);
        setForm({
          title: '',
          content: '',
          category: 'GENERAL',
          priority: 'NORMAL',
          requiresAcknowledgment: false,
          attachmentUrl: '',
          pinnedUntil: '',
          expiresAt: '',
        });
        loadData();
        loadBoardStats();
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al publicar comunicado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledge = async (announcementId) => {
    setActionLoading(true);
    try {
      const res = await markAnnouncementReadOrAcknowledge(announcementId, true);
      if (res.success) {
        showNotification('success', 'Acuse de recibo digital firmado y registrado');
        loadData();
        loadBoardStats();
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al registrar acuse de recibo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsRead = async (announcementId) => {
    try {
      const res = await markAnnouncementReadOrAcknowledge(announcementId, false);
      if (res.success) {
        showNotification('success', 'Lectura confirmada');
        loadData();
        loadBoardStats();
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al confirmar lectura');
    }
  };

  const handleOpenStats = async (announcementId) => {
    try {
      const res = await getAnnouncementStats(announcementId);
      if (res.success) {
        setSelectedStats(res.data);
        setStatsModalOpen(true);
      }
    } catch (error) {
      showNotification('error', error.message || 'Error al obtener métricas de lectura');
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    setActionLoading(true);
    try {
      await deleteAnnouncement(announcementToDelete.id);
      showNotification('success', 'Comunicado eliminado correctamente');
      setAnnouncementToDelete(null);
      loadData();
      loadBoardStats();
    } catch (error) {
      showNotification('error', error.message || 'Error al eliminar el comunicado');
    } finally {
      setActionLoading(false);
    }
  };

  const inputClass =
    'w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors';

  return (
    <div className="space-y-4">
      {/* Notificación Toast Sobria */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded border text-xs font-medium shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header ERP con Resumen Institucional */}
      <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
            Plataforma · Comunicación Institucional
          </p>
          <h1 className="text-xl font-semibold text-gray-900">Tablón de Anuncios y Comunicados</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Canal oficial de noticias, políticas de la empresa y acuses de recibo digitales.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
                Comunicados Oficiales
              </span>
              <span className="font-semibold text-gray-900 tabular-nums">
                {stats.total} publicados
              </span>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
                Políticas Vigentes
              </span>
              <span className="font-semibold text-blue-700 tabular-nums">{stats.policyCount}</span>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">
                Cumpleaños Mes
              </span>
              <span className="font-semibold text-emerald-700 tabular-nums">
                {stats.birthdayCount}
              </span>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
            >
              + Publicar Comunicado
            </button>
          )}
        </div>
      </div>

      {/* Pestañas con Contadores Integrados (Holded/Linear Style) */}
      <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Todos{' '}
            <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.total})</span>
          </button>

          <button
            onClick={() => setActiveTab('POLICY')}
            className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'POLICY'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Políticas & Reglamentos{' '}
            <span className="ml-1.5 font-mono text-[11px] text-gray-400">
              ({stats.policyCount})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HOLIDAY')}
            className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'HOLIDAY'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Feriados & Asuetos{' '}
            <span className="ml-1.5 font-mono text-[11px] text-amber-700">
              ({stats.holidayCount})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PENDING_ACK')}
            className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'PENDING_ACK'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Requieren Acuse de Recibo{' '}
            <span className="ml-1.5 font-mono text-[11px] text-blue-700">
              ({stats.pendingAcknowledgmentCount})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('BIRTHDAYS')}
            className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'BIRTHDAYS'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Cumpleaños del Mes{' '}
            <span className="ml-1.5 font-mono text-[11px] text-emerald-600">
              ({stats.birthdayCount})
            </span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      {activeTab !== 'BIRTHDAYS' && (
        <div className="bg-white p-3 rounded border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 w-full sm:w-auto flex-grow max-w-md"
          >
            <input
              type="text"
              placeholder="Buscar por título o contenido del comunicado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
            >
              Buscar
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setTimeout(loadData, 0);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer shrink-0"
              >
                Limpiar
              </button>
            )}
          </form>
        </div>
      )}

      {/* Layout Principal: Feed + Sidebar o Vista Cumpleaños */}
      {activeTab === 'BIRTHDAYS' ? (
        <AnnouncementsBirthdaysTab birthdays={birthdays} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <AnnouncementsFeed
              announcements={announcements}
              loading={loading}
              isAdmin={isAdmin}
              actionLoading={actionLoading}
              onOpenStats={handleOpenStats}
              onConfirmDelete={(ann) => setAnnouncementToDelete(ann)}
              onAcknowledge={handleAcknowledge}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>
          <AnnouncementsSidebar birthdays={birthdays} />
        </div>
      )}

      {/* Modales */}
      <PublishAnnouncementModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        form={form}
        setForm={setForm}
        onSubmit={handlePublishSubmit}
        actionLoading={actionLoading}
      />

      <AnnouncementReadStatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        selectedStats={selectedStats}
      />

      <ConfirmDeleteAnnouncementModal
        announcement={announcementToDelete}
        isOpen={!!announcementToDelete}
        onClose={() => setAnnouncementToDelete(null)}
        onConfirm={handleDeleteAnnouncement}
        actionLoading={actionLoading}
      />
    </div>
  );
};

export default AnnouncementsBoard;
