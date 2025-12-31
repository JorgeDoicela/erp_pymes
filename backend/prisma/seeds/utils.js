export function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export const firstNames = ['Juan', 'Maria', 'Carlos', 'Ana', 'Luis', 'Sofia', 'Pedro', 'Lucia', 'Miguel', 'Elena', 'Jose', 'Clara', 'David', 'Laura', 'Fernando', 'Patricia', 'Roberto', 'Carmen', 'Daniel', 'Marta'];
export const lastNames = ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Reyes', 'Morales', 'Cruz', 'Ortiz', 'Silva', 'Chavez'];
export const departments = ['IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations'];
export const positions = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager'];
export const banks = ['Banco Pichincha', 'Banco Guayaquil', 'Produbanco', 'Banco Internacional', 'Banco del Pacífico'];
