import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import indexRoutes from './routes/index.routes.js';
import systemRoutes from './routes/system/system.routes.js';
import { maintenanceMiddleware } from './middleware/maintenance.middleware.js';
import { errorHandler, requestLogger, validateBodyNotEmpty } from './middleware/errorHandler.js';
import { STORAGE_CONFIG } from './config/storage.config.js';

const app = express();

// Configuración de seguridad con Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: 'deny',
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
}));

// Configuración de CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como mobile apps o curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',  // Vite dev server
            'http://localhost:3000',  // Alternativa
            'https://recursoshumanos-eight.vercel.app', // Vercel Frontend
            process.env.FRONTEND_URL, // Producción
            process.env.ORIGIN,       // Soporte dinámico para ORIGIN
        ].filter(Boolean); // Eliminar undefined

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`[CORS] Blogged origin: ${origin}`);
            callback(new Error(`No permitido por CORS: ${origin}`));
        }
    },
    credentials: true, // Permitir cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Middlewares de parseo
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Servir archivos estáticos (uploads)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists on startup
import fs from 'fs';
const uploadsPath = process.env.VERCEL ? '/tmp/uploads' : path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

// Static files served protected below

// Middleware de logging (Request Logger original)
app.use(requestLogger);

// RNF-13: Performance Logging
import { performanceMiddleware } from './middleware/performance.middleware.js';
app.use(performanceMiddleware);

// Middleware de validación
app.use(validateBodyNotEmpty);

// Seguridad: HSTS (Strict-Transport-Security)
app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Prevención básica de XSS y Sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// RNF-12: Proteger Uploads
import { authenticate } from './middleware/auth.middleware.js';
import { protectStaticFiles } from './middleware/security.middleware.js';

// Servir archivos estáticos de forma protegida o mediante controlador
app.use('/uploads', authenticate, protectStaticFiles, (req, res, next) => {
    // Si es un CV, usamos el controlador para asegurar acceso en Vercel/Local
    if (req.path.includes('/resumes/')) {
        const filename = path.basename(req.path);
        const fullPath = path.join(STORAGE_CONFIG.PATHS.RESUMES, filename);
        
        if (fs.existsSync(fullPath)) {
            return res.sendFile(fullPath);
        } else {
            return res.status(404).json({
                message: 'Archivo no encontrado',
                detail: process.env.VERCEL 
                    ? 'En Vercel los archivos son temporales. Se recomienda usar Cloudinary.' 
                    : `El archivo no existe en la ruta: ${fullPath}`
            });
        }
    }
    // Para otros archivos, seguimos con static
    express.static(uploadsPath)(req, res, next);
});

// Maintenance Middleware (Applied before main routes)
app.use(maintenanceMiddleware);

// Rutas
app.use('/api/system', systemRoutes);
app.use('/api', indexRoutes);

// Middleware de manejo de errores (debe estar al final)
app.use(errorHandler);

export default app;
