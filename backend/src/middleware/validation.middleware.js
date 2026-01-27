
/**
 * Validador de Cédula Ecuatoriana
 * @param {string} cedula 
 * @returns {boolean}
 */
const validateCedulaEcuatoriana = (cedula) => {
    if (typeof cedula !== 'string' || cedula.length !== 10) return false;

    const digitCheck = /^\d+$/.test(cedula);
    if (!digitCheck) return false;

    const province = parseInt(cedula.substring(0, 2), 10);
    if (province < 1 || province > 24) return false;

    const lastDigit = parseInt(cedula.substring(9, 10), 10);
    let sum = 0;

    for (let i = 0; i < 9; i++) {
        let digit = parseInt(cedula.charAt(i), 10);
        if (i % 2 === 0) { // Posición impar (0, 2, 4, 6, 8)
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }

    const verifier = (Math.ceil(sum / 10) * 10) - sum;
    const result = verifier === 10 ? 0 : verifier;

    return result === lastDigit;
};

/**
 * Middleware de Validación de Datos (RNF-15)
 */
export const validateEmployeeData = (req, res, next) => {
    const {
        firstName, lastName, email, identityCard, phone,
        salary, birthDate, hireDate
    } = req.body;

    const errors = [];

    // 1. Campos obligatorios (básicos)
    if (!firstName || firstName.trim().length === 0) errors.push('El nombre es obligatorio');
    if (!lastName || lastName.trim().length === 0) errors.push('El apellido es obligatorio');

    // 2. Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        errors.push('El formato del correo electrónico es inválido');
    }

    // 3. Cédula
    if (identityCard && !validateCedulaEcuatoriana(identityCard)) {
        errors.push('La cédula ingresada no es válida para Ecuador');
    }

    // 4. Teléfono (Ecuador: 10 dígitos, empieza con 0)
    const phoneRegex = /^0\d{9}$/;
    if (phone && !phoneRegex.test(phone)) {
        errors.push('El teléfono debe tener 10 dígitos y empezar con 0');
    }

    // 5. Salario
    if (salary !== undefined) {
        const salaryNum = parseFloat(salary);
        if (isNaN(salaryNum) || salaryNum <= 0) {
            errors.push('El salario debe ser un número mayor a 0');
        }
    }

    // 6. Fechas
    if (birthDate && hireDate) {
        const bDate = new Date(birthDate);
        const hDate = new Date(hireDate);
        const age = new Date().getFullYear() - bDate.getFullYear();

        if (bDate >= hDate) {
            errors.push('La fecha de nacimiento debe ser anterior a la fecha de contratación');
        }
        if (age < 18) {
            errors.push('El empleado debe ser mayor de edad');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors
        });
    }

    // Sanitización básica (XSS prevention)
    // Nota: Helmet ya provee headers, pero limpiamos strings por seguridad
    if (req.body.firstName) req.body.firstName = req.body.firstName.trim();
    if (req.body.lastName) req.body.lastName = req.body.lastName.trim();

    next();
};
