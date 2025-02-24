import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import path from "path";

// Cargar variables de entorno
dotenv.config();

// Validar variables de entorno críticas
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.error("Error: JWT_SECRET no está definido en las variables de entorno.");
    process.exit(1);
}

// Crear la aplicación Express
const app: Application = express();

// Configurar Express para confiar en Railway como proxy
app.set("trust proxy", 1);

// Configuración de CORS
const corsOptions = {
    origin: 'https://challengeinit-production.up.railway.app',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middlewares para parsear solicitudes JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Seguridad con Helmet
app.use(helmet());

// Limitar peticiones para evitar abusos
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 200,
    message: "Has realizado demasiadas solicitudes, intenta más tarde.",
});
app.use(limiter);

// Middleware para logging (opcional)
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Definir la ruta de la carpeta donde se encuentra el build de Angular (por ejemplo, "public")
const angularDistPath = path.join(__dirname, "public");

// Servir archivos estáticos de Angular
app.use(express.static(angularDistPath));

// Rutas de la API
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: "Servidor Express con TypeScript funcionando en Railway!" });
});
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// Ruta catch-all para peticiones GET: redirige al index.html de Angular
app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(angularDistPath, "index.html"));
});

// Middleware para manejar errores 404 en otros métodos (POST, PUT, etc.)
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// Middleware global de manejo de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Error interno:", err.message);
    res.status(500).json({ error: "Error interno del servidor", message: err.message });
});

export default app;
