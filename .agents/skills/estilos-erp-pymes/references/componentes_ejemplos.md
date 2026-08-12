# Referencia de Componentes React & CSS para ERP PYME

Ejemplos prácticos y listos para producción para implementar la arquitectura visual limpia definida en la skill `estilos-erp-pymes`.

---

## 1. Componente: Tabla de Alta Densidad (ERP Data Grid)

```tsx
import React, { useState } from 'react';

interface ErpTableProps<T> {
  columns: { key: string; header: string; width?: string }[];
  data: T[];
  onRowClick?: (item: T) => void;
  renderStatus?: (item: T) => React.ReactNode;
}

export function ErpTable<T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  renderStatus
}: ErpTableProps<T>) {
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');

  return (
    <div className="erp-table-container">
      {/* Controles de densidad y acciones masivas */}
      <div className="erp-table-toolbar">
        <div className="search-input">
          <input type="text" placeholder="Filtrar registros... (Ctrl + /)" />
        </div>
        <div className="density-toggle">
          <button 
            className={density === 'compact' ? 'active' : ''} 
            onClick={() => setDensity('compact')}
          >
            Compacta (36px)
          </button>
          <button 
            className={density === 'comfortable' ? 'active' : ''} 
            onClick={() => setDensity('comfortable')}
          >
            Cómoda (48px)
          </button>
        </div>
      </div>

      {/* Tabla con Sticky Header */}
      <div className="erp-table-wrapper">
        <table className={`erp-table density-${density}`}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" /></th>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>{col.header}</th>
              ))}
              <th style={{ width: '100px' }}>Estado</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} onClick={() => onRowClick && onRowClick(row)}>
                <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                {columns.map((col) => (
                  <td key={col.key}>{(row as any)[col.key]}</td>
                ))}
                <td>{renderStatus ? renderStatus(row) : null}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-text-xs">Editar</button>
                  <button className="btn-text-xs">Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 2. Componente: Tarjeta KPI Sobria

```tsx
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  trendLabel = 'vs mes anterior'
}) => {
  const isPositive = trend >= 0;

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <span className={`kpi-badge ${isPositive ? 'trend-up' : 'trend-down'}`}>
          {isPositive ? '+' : ''}{trend}%
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-footer">
        <span className="kpi-trend-label">{trendLabel}</span>
      </div>
    </div>
  );
};
```

---

## 3. Componente: Drawer Lateral de Preservación de Contexto

```tsx
import React from 'react';

interface ErpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const ErpDrawer: React.FC<ErpDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="erp-drawer-overlay" onClick={onClose}>
      <div className="erp-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="erp-drawer-header">
          <h3>{title}</h3>
          <button className="btn-close" onClick={onClose}>Cerrar</button>
        </div>
        <div className="erp-drawer-body">
          {children}
        </div>
        <div className="erp-drawer-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};
```

---

## 4. Componente: Buscador Global (Command Palette `Ctrl + K`)

```tsx
import React, { useEffect, useState } from 'react';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={() => setIsOpen(false)}>
      <div className="command-palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-input-wrapper">
          <input 
            type="text" 
            autoFocus 
            placeholder="Escribe un comando o busca facturas, clientes, empleados..." 
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-palette-results">
          <div className="command-group-title font-bold text-xs">Acciones Rápidas</div>
          <div className="command-item">Crear Nueva Factura</div>
          <div className="command-item">Registrar Nuevo Empleado</div>
          <div className="command-item">Consultar Stock de Inventario</div>
        </div>
      </div>
    </div>
  );
};
```
