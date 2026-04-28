/**
 * @file uploadMiddleware.js
 * @description Configuración de Multer para la gestión de subida de archivos.
 * Implementa almacenamiento en disco con organización dinámica por carpetas (productos, colecciones, campañas)
 * y validación de tipos de archivo (solo imágenes).
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: fileFilter
});

export default upload;
