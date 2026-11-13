/**
 * @file IpRestrictionPanel.jsx
 * @description Panel de configuración de control de acceso por direcciones IP y rangos CIDR
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FiPlus, FiX } from 'react-icons/fi';
import { Button } from '@core/ui';

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV4_CIDR_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\/([0-9]|[12]\d|3[0-2])$/;
const IPV4_WILDCARD_REGEX =
  /^(\*|(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))(\.(\*|(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))){3}$/;

const isValidIpInput = (value) => {
  const clean = value.trim();
  if (!clean) return false;
  return (
    IPV4_REGEX.test(clean) ||
    IPV4_CIDR_REGEX.test(clean) ||
    IPV4_WILDCARD_REGEX.test(clean) ||
    clean.includes(':')
  );
};

const IpRestrictionPanel = ({
  enabled,
  allowedIPs,
  yourIp,
  canMutate,
  onToggleEnabled,
  onChangeAllowedIPs,
  onAddCurrentIp,
}) => {
  const [draftIp, setDraftIp] = useState('');
  const [inputError, setInputError] = useState('');

  const ipList = useMemo(() => {
    if (!allowedIPs) return [];
    return allowedIPs
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [allowedIPs]);

  const handleAddIp = () => {
    const clean = draftIp.trim();
    if (!clean) return;
    if (!isValidIpInput(clean)) {
      setInputError(
        'Formato inválido. Usa IPv4 (192.168.1.10), CIDR (192.168.1.0/24) o comodín (192.168.1.*).'
      );
      return;
    }
    if (ipList.includes(clean)) {
      setInputError('Esta dirección IP o rango ya se encuentra en la lista.');
      return;
    }
    setInputError('');
    onChangeAllowedIPs([...ipList, clean].join(', '));
    setDraftIp('');
  };

  const handleRemoveIp = (ipToRemove) => {
    const next = ipList.filter((item) => item !== ipToRemove);
    onChangeAllowedIPs(next.join(', '));
  };

  return (
    <div className="pt-4 border-t border-gray-200 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
            Control de Acceso por Red (IPs Permitidas)
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Si está activo, el marcaje de asistencia solo se permitirá desde las redes autorizadas.
            Al desactivarlo, se conserva tu lista guardada sin restringir accesos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`text-xs font-medium ${enabled ? 'text-green-800' : 'text-gray-500'}`}>
            {enabled ? 'Activo' : 'Inactivo'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Activar o desactivar restricción por IP"
            disabled={!canMutate}
            onClick={onToggleEnabled}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
              enabled ? 'bg-blue-600' : 'bg-gray-300'
            } ${!canMutate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-gray-600">
          Lista blanca de IPs / Subredes ({ipList.length})
        </span>
        {yourIp && canMutate && (
          <button
            type="button"
            onClick={onAddCurrentIp}
            className="text-xs text-blue-600 hover:underline cursor-pointer font-mono tabular-nums"
          >
            + Agregar mi IP actual ({yourIp})
          </button>
        )}
      </div>

      {canMutate && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              aria-label="Nueva IP o rango CIDR"
              value={draftIp}
              onChange={(e) => {
                setDraftIp(e.target.value);
                if (inputError) setInputError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddIp();
                }
              }}
              placeholder="Ej: 192.168.1.10, 192.168.1.0/24 o 192.168.1.*"
              className="flex-1 bg-white border border-gray-200 rounded px-3 py-1.5 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddIp}>
              <FiPlus size={13} />
              <span>Agregar</span>
            </Button>
          </div>
          {inputError && <p className="text-xs text-red-600">{inputError}</p>}
        </div>
      )}

      {ipList.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {ipList.map((ip) => (
            <span
              key={ip}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-mono text-gray-800"
            >
              <span>{ip}</span>
              {canMutate && (
                <button
                  type="button"
                  onClick={() => handleRemoveIp(ip)}
                  aria-label={`Quitar IP ${ip}`}
                  className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <FiX size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400">
          No hay direcciones IP registradas. Agrega al menos una IP o rango CIDR para poder activar
          el bloqueo por red.
        </p>
      )}
    </div>
  );
};

IpRestrictionPanel.propTypes = {
  enabled: PropTypes.bool.isRequired,
  allowedIPs: PropTypes.string,
  yourIp: PropTypes.string,
  canMutate: PropTypes.bool.isRequired,
  onToggleEnabled: PropTypes.func.isRequired,
  onChangeAllowedIPs: PropTypes.func.isRequired,
  onAddCurrentIp: PropTypes.func.isRequired,
};

export default IpRestrictionPanel;
