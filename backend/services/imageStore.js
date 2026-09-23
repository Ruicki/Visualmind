/**
 * @file imageStore.js
 * @description Persistencia de imágenes subidas en PostgreSQL.
 * El disco de Render (plan gratuito) es efímero: los archivos de `uploads/` se pierden
 * en cada reinicio o deploy. Por eso cada imagen subida también se guarda en la tabla
 * `uploaded_images` y se sirve desde la BD cuando no existe en disco.
 * Las URLs guardadas en productos/colecciones/campañas no cambian (`uploads/<carpeta>/<archivo>`).
 */

import fs from 'fs';
import pool from '../src/config/db.js';

/** Normaliza una ruta a la clave usada en la tabla: sin "/" inicial. */
const toKey = (p) => p.replace(/^\/+/, '');

/**
 * ensureImagesTable
 * @description Crea la tabla de imágenes si no existe (idempotente).
 */
export const ensureImagesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS uploaded_images (
      path       VARCHAR(500) PRIMARY KEY,
      mime_type  VARCHAR(100) NOT NULL,
      data       BYTEA NOT NULL,
      size       INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

/**
 * persistUploads
 * @description Middleware que se ejecuta después de Multer: copia cada archivo subido a la BD.
 */
export const persistUploads = async (req, res, next) => {
  const files = [
    ...(req.file ? [req.file] : []),
    ...Object.values(req.files || {}).flat(),
  ];
  try {
    for (const file of files) {
      const data = await fs.promises.readFile(file.path);
      await pool.query(
        `INSERT INTO uploaded_images (path, mime_type, data, size)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (path) DO UPDATE SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data, size = EXCLUDED.size`,
        [toKey(file.path.split('\\').join('/')), file.mimetype, data, file.size]
      );
    }
    next();
  } catch (error) {
    console.error('[ImageStore] Error guardando imagen en BD:', error.message);
    res.status(500).json({ message: 'No se pudo guardar la imagen' });
  }
};

/**
 * serveStoredImage
 * @description Sirve una imagen desde la BD (fallback cuando no está en disco).
 * @route GET /uploads/*
 */
export const serveStoredImage = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT mime_type, data FROM uploaded_images WHERE path = $1',
      [toKey(`uploads${req.path}`)]
    );
    if (result.rows.length === 0) return next();
    const { mime_type, data } = result.rows[0];
    res.set('Content-Type', mime_type);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(data);
  } catch (error) {
    console.error('[ImageStore] Error sirviendo imagen:', error.message);
    next();
  }
};

/**
 * deleteStoredImage
 * @description Elimina una imagen de la BD (si existe).
 */
export const deleteStoredImage = async (imagePath) => {
  if (!imagePath) return;
  await pool.query('DELETE FROM uploaded_images WHERE path = $1', [toKey(imagePath)]);
};
