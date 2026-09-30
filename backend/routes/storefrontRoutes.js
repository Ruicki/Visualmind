import express from 'express';
import pool from '../src/config/db.js';
import { toCsv } from '../services/csv.js';
import { renderSharePage, catalogRows, CATALOG_HEADERS, productUrl } from '../services/storefront.js';
import { frontendUrl } from '../controllers/authController.js';

const router = express.Router();
const VISIBLE = "lifecycle_state IN ('Published', 'Legacy')";

/**
 * GET /share/p/:id
 * Enlace para compartir un producto: WhatsApp, Facebook e Instagram leen aquí la foto,
 * el nombre y el precio; las personas son redirigidas a la ficha en la tienda.
 */
router.get('/share/p/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, price, image_url FROM products WHERE id::text = $1 AND ${VISIBLE}`,
      [req.params.id]
    );
    if (rows.length === 0) return res.redirect(302, `${frontendUrl()}/shop`);
    res.set('Cache-Control', 'public, max-age=300');
    res.type('html').send(renderSharePage(rows[0], req));
  } catch (error) {
    console.error('[Share] Error:', error.message);
    res.redirect(302, productUrl(req.params.id));
  }
});

/**
 * GET /api/feeds/catalog.csv
 * Catálogo de productos para Meta Commerce Manager (Instagram/Facebook Shopping) y
 * Google Merchant Center. Se registra como "feed programado" con esta URL.
 */
router.get('/api/feeds/catalog.csv', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, price, stock, image_url, category FROM products
       WHERE ${VISIBLE} ORDER BY priority DESC, created_at DESC`
    );
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(toCsv(CATALOG_HEADERS, catalogRows(rows, req)));
  } catch (error) {
    console.error('[Feed] Error:', error.message);
    res.status(500).json({ error: 'No se pudo generar el catálogo' });
  }
});

export default router;
