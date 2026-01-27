
/**
 * Validador de Cédula Ecuatoriana (Front-end)
 */
export const validateCedula = (cedula) => {
    if (!cedula) return "La cédula es obligatoria";
    if (cedula.length !== 10) return "La cédula debe tener 10 dígitos";
    if (!/^\d+$/.test(cedula)) return "La cédula solo debe contener números";

    const province = parseInt(cedula.substring(0, 2), 10);
    if (province < 1 || province > 24) return "Provincia inválida en la cédula";

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let digit = parseInt(cedula.charAt(i), 10);
        if (i % 2 === 0) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }

    const verifier = (Math.ceil(sum / 10) * 10) - sum;
    const result = verifier === 10 ? 0 : verifier;

    if (result !== parseInt(cedula.substring(9, 10), 10)) {
        return "La cédula no es válida";
    }

    return null;
};

/**
 * Validador de Email
 */
export const validateEmail = (email) => {
    if (!email) return "El correo es obligatorio";
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return "Formato de correo inválido";
    return null;
};

/**
 * Validador de Teléfono
 */
export const validatePhone = (phone) => {
    if (!phone) return "El teléfono es obligatorio";
    if (!/^0\d{9}$/.test(phone)) return "Debe tener 10 dígitos y empezar con 0";
    return null;
};

/**
 * Validador de Salario
 */
export const validateSalary = (salary) => {
    if (salary === undefined || salary === "") return "El salario es obligatorio";
    const num = parseFloat(salary);
    if (isNaN(num) || num <= 0) return "Debe ser un número mayor a 0";
    return null;
};

/**
 * Validador de Coherencia de Fechas
 */
export const validateDates = (birthDate, hireDate) => {
    if (!birthDate || !hireDate) return null;
    const b = new Date(birthDate);
    const h = new Date(hireDate);

    if (b >= h) return "La fecha de nacimiento debe ser anterior a la de contratación";

    const age = new Date().getFullYear() - b.getFullYear();
    if (age < 18) return "El empleado debe ser mayor de edad";

    return null;
};
