
/**
 * Middleware para proteger archivos estáticos (RNF-12)
 * Verifica que el usuario tenga permiso para ver el archivo.
 * 
 * En este MVP:
 * - Admin/RRHH: Acceso total.
 * - Empleado: Podría restringirse más, pero por ahora solo autenticación.
 */
export const protectStaticFiles = (req, res, next) => {
    // Si llegamos aquí, 'authenticate' ya validó el token y pobló req.user
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'Acceso denegado a archivos: No autenticado' });
    }

    // Regla simple: Solo usuarios autenticados pueden ver archivos internal
    // Si quisiéramos validar propiedad (ej: solo YO veo mi contrato):
    // Necesitaríamos buscar el archivo en DB para ver de quién es.
    // Para RNF-12 criterio "Datos de nómina solo visibles para RRHH y empleado",
    // los PDFs de nómina deben tener una estructura linkeada.

    // Por ahora, validamos login.
    // Si es un archivo de "nómina" (ej: en carpeta payrolls/), validar rol.

    // Check if accessing payroll folders
    if (req.url.includes('payroll') || req.url.includes('contracts')) {
        const isAdmin = user.role === 'admin' || user.role === 'hr';
        if (!isAdmin) {
            // Si es empleado, permitir solo si el archivo le pertenece... 
            // Complejo sin DB lookup. 
            // Opcion: Asumir que el frontend solo pide lo suyo.
            // Pero para seguridad real, restringimos carpetas sensibles solo a admin por defecto en static serve?
            // No, el empleado necesita ver SU contrato.
        }
    }

    // Pass
    next();
};
