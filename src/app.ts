import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";

// Cargar variables de entorno antes de configurar Express
dotenv.config();

// Validar variables de entorno críticas
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.error("Error: JWT_SECRET no está definido en las variables de entorno.");
    process.exit(1);
}

// Crear la aplicación Express
const app: Application = express();

// Importante para que Express confíe en Railway como proxy
app.set("trust proxy", 1);

// Configuración de CORS
const corsOptions = {
    origin: 'https://challengeinit-production.up.railway.app',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true
};

app.use(cors(corsOptions));

// Middleware para manejar solicitudes OPTIONS (preflight)
app.options('*', cors(corsOptions));

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Seguridad con Helmet
app.use(helmet());

// Limitar peticiones para evitar abusos en Railway
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 200,
    message: "Has realizado demasiadas solicitudes, intenta más tarde.",
});
app.use(limiter);

// Middleware para logging de cada petición (opcional, si no usas logger, puedes eliminarlo)
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Ruta de prueba para verificar que el servidor está funcionando
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: "Servidor Express con TypeScript funcionando en Railway!" });
});

// Configurar rutas
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// Middleware para manejar errores 404 (Ruta no encontrada)
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// Middleware para manejar errores globales
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Error interno:", err.message);
    res.status(500).json({ error: "Error interno del servidor", message: err.message });
});

export default app;