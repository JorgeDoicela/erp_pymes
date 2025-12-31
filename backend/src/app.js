import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import indexRoutes from './routes/index.routes.js';
import { errorHandler, requestLogger, validateBodyNotEmpty } from './middleware/errorHandler.js';

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
            process.env.FRONTEND_URL, // Producción
        ].filter(Boolean); // Eliminar undefined

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true, // Permitir cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Middlewares de parseo
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (uploads)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists on startup
import fs from 'fs';
const uploadsPath = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

app.use('/uploads', express.static(uploadsPath));
console.log('Serving static files from:', uploadsPath); // DEBUG

// Middleware de logging
app.use(requestLogger);

// Middleware de validación
app.use(validateBodyNotEmpty);

// Rutas
app.use(indexRoutes);

// Middleware de manejo de errores (debe estar al final)
app.use(errorHandler);

export default app;
