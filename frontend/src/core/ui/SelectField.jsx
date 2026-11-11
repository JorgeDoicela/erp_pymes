/**
 * @file SelectField.jsx
 * @description Alias retrocompatible de Select atómico (Design System)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Select } from './Select.jsx';

export const SelectField = React.forwardRef((props, ref) => <Select ref={ref} {...props} />);

SelectField.displayName = 'SelectField';

export default SelectField;
