# Plantilla de Módulo Frontend

Ejemplo para el recurso `overtime` del dominio `attendance`. Sustituir nombres.

---

## `modules/attendance/services/overtime.service.js`

```js
/**
 * @file overtime.service.js
 * @description Fachada HTTP de solicitudes de horas extra.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import httpClient from '@core/api/httpClient';

const BASE_PATH = '/overtime';

/** @param {{ status?: string, page?: number, limit?: number }} params */
export async function listOvertime(params = {}) {
  const { data } = await httpClient.get(BASE_PATH, { params });
  return { items: data.data, meta: data.meta };
}

/** @param {{ date: string, hours: number, type: string, reason: string }} payload */
export async function requestOvertime(payload) {
  const { data } = await httpClient.post(BASE_PATH, payload);
  return data.data;
}
```

## `modules/attendance/hooks/useOvertime.js`

```js
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listOvertime, requestOvertime } from '../services/overtime.service';

const extractMessage = (error, fallback) => error?.response?.data?.message || fallback;

export function useOvertime(initialFilters = { page: 1, limit: 20 }) {
  const [filters, setFilters] = useState(initialFilters);
  const [state, setState] = useState({ items: [], meta: null, status: 'loading', error: null });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      const { items, meta } = await listOvertime(filters);
      setState({ items, meta, status: 'success', error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, status: 'error', error: extractMessage(error, 'No se pudo cargar') }));
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(
    async (payload) => {
      await requestOvertime(payload);
      toast.success('Solicitud registrada');
      await load();
    },
    [load]
  );

  return { ...state, filters, setFilters, reload: load, submit };
}
```

## `modules/attendance/components/overtime/OvertimeTable.jsx`

```jsx
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@core/ui';
import { formatDate } from '@core/utils/formatters';

export function OvertimeTable({ items }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Colaborador</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Horas</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{`${item.employee.firstName} ${item.employee.lastName}`}</TableCell>
            <TableCell className="font-mono tabular-nums">{formatDate(item.date)}</TableCell>
            <TableCell className="font-mono tabular-nums">{item.hours}</TableCell>
            <TableCell className="text-gray-700 font-medium">{item.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

OvertimeTable.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
};
```

## `modules/attendance/pages/OvertimePage.jsx`

```jsx
import { EmptyState, TableSkeleton } from '@core/ui';
import { ErrorState } from '@core/feedback';
import { useOvertime } from '../hooks/useOvertime';
import { OvertimeTable } from '../components/overtime/OvertimeTable';

export default function OvertimePage() {
  const { items, status, error, reload } = useOvertime();

  return (
    <section className="space-y-4">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Asistencia</p>
        <h1 className="text-lg font-semibold text-gray-900">Horas extra</h1>
      </header>
      {status === 'loading' && <TableSkeleton />}
      {status === 'error' && <ErrorState message={error} onRetry={reload} />}
      {status === 'success' && items.length === 0 && (
        <EmptyState title="Sin solicitudes" description="No hay horas extra registradas en el periodo." />
      )}
      {status === 'success' && items.length > 0 && <OvertimeTable items={items} />}
    </section>
  );
}
```

> [!NOTE]
> Verificar las props reales de `EmptyState`, `ErrorState` y `TableSkeleton` en `core/ui` y `core/feedback` antes de usarlas; la plantilla ilustra la forma, no sustituye la lectura del componente.

## `App.jsx` (registro de ruta)

```jsx
const OvertimePage = lazy(() => import('@modules/attendance/pages/OvertimePage.jsx'));
// <Route path="/attendance/overtime" element={<RequireAuth roles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]}><OvertimePage /></RequireAuth>} />
```

