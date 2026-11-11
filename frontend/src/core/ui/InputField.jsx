/**
 * @file InputField.jsx
 * @description Alias retrocompatible de Input atómico (Design System)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Input } from './Input.jsx';

export const InputField = React.forwardRef((props, ref) => <Input ref={ref} {...props} />);

InputField.displayName = 'InputField';

export default InputField;
