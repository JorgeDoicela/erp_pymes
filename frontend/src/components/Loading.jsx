/**
 * @file Loading.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

const Loading = ({ message = 'Cargando datos...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        <p className="mt-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Loading;
