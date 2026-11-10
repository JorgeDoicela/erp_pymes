/**
 * @file AttendanceSummaryCard.jsx
 * @description Resumen de jornada diaria con georreferenciación inversa y badges de puntualidad.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin } from 'react-icons/fi';
import systemService from '../../../services/systemService';

export const AttendanceSummaryCard = ({ recordData }) => {
  const [entryLocationName, setEntryLocationName] = useState(null);
  const [exitLocationName, setExitLocationName] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLocationNames = async () => {
      if (recordData?.entryLocation && !entryLocationName) {
        try {
          const { lat, lng } = recordData.entryLocation;
          const data = await systemService.reverseGeocode(lat, lng);
          if (data && data.display_name && isMounted) {
            const name = data.display_name.split(',').slice(0, 3).join(',');
            setEntryLocationName(name);
          }
        } catch (error) {
          console.error('Error reverse geocoding entry coordinates:', error);
        }
      }

      if (recordData?.exitLocation && !exitLocationName) {
        if (
          recordData.entryLocation &&
          recordData.exitLocation.lat === recordData.entryLocation.lat &&
          recordData.exitLocation.lng === recordData.entryLocation.lng
        ) {
          if (entryLocationName && isMounted) {
            setExitLocationName(entryLocationName);
          }
        } else {
          try {
            const { lat, lng } = recordData.exitLocation;
            const data = await systemService.reverseGeocode(lat, lng);
            if (data && data.display_name && isMounted) {
              const name = data.display_name.split(',').slice(0, 3).join(',');
              setExitLocationName(name);
            }
          } catch (error) {
            console.error('Error reverse geocoding exit coordinates:', error);
          }
        }
      }
    };

    fetchLocationNames();

    return () => {
      isMounted = false;
    };
  }, [recordData, entryLocationName, exitLocationName]);

  if (!recordData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 w-full max-w-md bg-gray-50 rounded-[4px] p-4 text-xs border border-gray-200"
    >
      <h4 className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold mb-3 border-b border-gray-200 pb-2">
        Resumen de Hoy
      </h4>
      <div className="space-y-3">
        {/* Entrada */}
        {recordData.checkIn && (() => {
          const entryLocationDisplay =
            entryLocationName ||
            (recordData.entryLocation
              ? `${recordData.entryLocation.lat.toFixed(4)}, ${recordData.entryLocation.lng.toFixed(4)}`
              : null);

          return (
            <div className="flex justify-between items-start">
              <span className="text-gray-500 pt-0.5">Entrada:</span>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900 tabular-nums">
                    {new Date(recordData.checkIn).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {recordData.isLate ? (
                    <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-[4px] border border-amber-200 font-medium">
                      Tardío
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-[4px] border border-emerald-200 font-medium">
                      Puntual
                    </span>
                  )}
                </div>
                {entryLocationDisplay && (
                  <div
                    className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5 text-right w-full justify-end"
                    title={entryLocationDisplay}
                  >
                    <FiMapPin className="w-3 h-3 shrink-0 text-gray-400" />
                    <span className="max-w-[250px] break-words">{entryLocationDisplay}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Almuerzo */}
        {recordData.breakStart && (() => {
          const lunchLocationDisplay =
            entryLocationName ||
            exitLocationName ||
            (recordData.entryLocation
              ? `${recordData.entryLocation.lat.toFixed(4)}, ${recordData.entryLocation.lng.toFixed(4)}`
              : null);

          return (
            <div className="flex justify-between items-start pt-2 border-t border-gray-200">
              <span className="text-gray-500 pt-0.5">Almuerzo:</span>
              <div className="flex flex-col items-end">
                <span className="font-mono text-gray-900 tabular-nums">
                  {new Date(recordData.breakStart).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {recordData.breakEnd &&
                    ` - ${new Date(recordData.breakEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
                {lunchLocationDisplay && (
                  <div
                    className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5 text-right w-full justify-end"
                    title={lunchLocationDisplay}
                  >
                    <FiMapPin className="w-3 h-3 shrink-0 text-gray-400" />
                    <span className="max-w-[250px] break-words">{lunchLocationDisplay}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Salida */}
        {recordData.checkOut && (() => {
          const exitLocationDisplay =
            exitLocationName ||
            (recordData.exitLocation
              ? `${recordData.exitLocation.lat.toFixed(4)}, ${recordData.exitLocation.lng.toFixed(4)}`
              : entryLocationName ||
                (recordData.entryLocation
                  ? `${recordData.entryLocation.lat.toFixed(4)}, ${recordData.entryLocation.lng.toFixed(4)}`
                  : null));

          return (
            <div className="flex justify-between items-start pt-2 border-t border-gray-200">
              <span className="text-gray-500 pt-0.5">Salida:</span>
              <div className="flex flex-col items-end">
                <span className="font-mono font-bold text-gray-900 tabular-nums">
                  {new Date(recordData.checkOut).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {exitLocationDisplay && (
                  <div
                    className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5 text-right w-full justify-end"
                    title={exitLocationDisplay}
                  >
                    <FiMapPin className="w-3 h-3 shrink-0 text-gray-400" />
                    <span className="max-w-[250px] break-words">{exitLocationDisplay}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
};

export default AttendanceSummaryCard;
