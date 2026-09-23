/**
 * @file uploadMiddleware.js
 * @description Configuración de Multer para la gestión de subida de archivos.
 * Implementa almacenamiento en disco con organización dinámica por carpetas (productos, colecciones, campañas)
 * y validación de tipos de archivo (solo imágenes).
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../src/config/db.js';

// Asegurar que la carpeta de destino base exista
const uploadDir = 'uploads/products';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * storage
 * @description Configura el motor de almacenamiento en disco.
 * Determina dinámicamente la carpeta de destino basándose en la URL de la petición.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads/products';
        
        // Determinar carpeta basada en la ruta o el campo
        if (req.originalUrl.includes('/collections')) {
            folder = 'uploads/collections';
        } else if (req.originalUrl.includes('/campaigns')) {
            folder = 'uploads/campaigns';
        } else if (req.originalUrl.includes('/seasons')) {
            folder = 'uploads/seasons';
        }

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        // Nombre único: timestamp + número aleatorio + extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

/**
 * fileFilter
 * @description Valida que el archivo subido sea una imagen permitida (jpeg, jpg, png, webp).
 */
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
    }
};

/**
 * Instancia de Multer configurada
 * Límite de tamaño: 5MB por archivo.
 */
const multerUpload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

/**
 * persistUploadsToDb
 * @description Copia cada archivo recién subido a la tabla `uploaded_files`.
 * El disco de la mayoría de hostings (Railway sin volumen, Render, etc.) se borra
 * en cada redeploy; así la imagen sigue disponible en la misma URL /uploads/...
 */
const persistUploadsToDb = async (req, res, next) => {
    const files = req.file ? [req.file] : Object.values(req.files || {}).flat();
    try {
        for (const file of files) {
            const publicPath = '/' + path.posix.join(file.destination.replace(/\\/g, '/'), file.filename);
            const data = await fs.promises.readFile(file.path);
            await pool.query(
                `INSERT INTO uploaded_files (path, mime_type, data) VALUES ($1, $2, $3)
                 ON CONFLICT (path) DO UPDATE SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data`,
                [publicPath, file.mimetype, data]
            );
        }
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Misma API que multer (upload.fields / upload.single / upload.array), pero cada
 * método devuelve [multer, persistencia]. Express acepta arrays de middlewares,
 * así que las rutas existentes no cambian.
 */
const upload = {
    fields: (...args) => [multerUpload.fields(...args), persistUploadsToDb],
    single: (...args) => [multerUpload.single(...args), persistUploadsToDb],
    array: (...args) => [multerUpload.array(...args), persistUploadsToDb],
};

/**
 * serveUploadFromDb
 * @description Respaldo para GET /uploads/*: si el archivo no está en disco
 * (p. ej. tras un redeploy), lo sirve desde la base de datos.
 */
export const serveUploadFromDb = async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    try {
        const publicPath = decodeURIComponent('/uploads' + req.path);
        const result = await pool.query('SELECT mime_type, data FROM uploaded_files WHERE path = $1', [publicPath]);
        if (result.rowCount === 0) return next();
        res.set('Content-Type', result.rows[0].mime_type);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(result.rows[0].data);
    } catch (error) {
        next(error);
    }
};

export default upload;
