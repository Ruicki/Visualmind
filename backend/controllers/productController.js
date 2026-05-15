/**
 * @file productController.js
 * @description Controlador para la lógica de negocio de productos.
 * Maneja operaciones CRUD, gestión de variantes mediante agregación JSON en SQL,
 * y persistencia de archivos de imagen.
 */

import pool from '../src/config/db.js';
import fs from 'fs';
import path from 'path';

/**
 * getAllProducts
 * @description Obtiene todos los productos publicados.
 * Implementa búsqueda por texto (ILIKE) y agregación de variantes en una sola consulta.
 */
/**
 * Obtiene todos los productos activos para la tienda pública.
 * Incluye variantes mediante agregación JSON y nombres de categorías/campañas.
 */
export const getAllProducts = async (req, res) => {
    try {
        const { search } = req.query;

        let query;
        let params = [];

        // Query base con agregación JSON para variantes (evita el problema N+1)
        const baseQuery = `
            SELECT p.*, 
                   c.end_date as campaign_end_date, c.is_active as campaign_is_active,
                   COALESCE(
                       (SELECT json_agg(pv.*) 
                        FROM product_variants pv 
                        WHERE pv.product_id = p.id), 
                       '[]'
                   ) as variants
            FROM products p
            LEFT JOIN campaigns c ON p.campaign_id = c.id
        `;

        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            query = `
                ${baseQuery}
                WHERE p.lifecycle_state IN ('Published', 'Legacy')
                  AND (
                    p.title ILIKE $1 OR
                    p.category ILIKE $1 OR
                    p.sub_category ILIKE $1
                  )
                ORDER BY p.priority DESC, p.created_at DESC
            `;
            params = [term];
        } else {
            query = `
                ${baseQuery}
                WHERE p.lifecycle_state IN ('Published', 'Legacy')
                ORDER BY p.priority DESC, p.created_at DESC
            `;
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * getAdminProducts
 * @description Obtiene la lista completa de productos con detalles administrativos 
 * (stock total, conteo de variantes y nombres de campañas/temporadas).
 */
export const getAdminProducts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, 
                   COALESCE(
                       (SELECT json_agg(pv.*) 
                        FROM product_variants pv 
                        WHERE pv.product_id = p.id), 
                       '[]'
                   ) as variants,
                   (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variants_count,
                   (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as variants_stock,
                   c.name as campaign_name,
                   col.name as collection_name
            FROM products p 
            LEFT JOIN campaigns c ON p.campaign_id = c.id
            LEFT JOIN collections col ON p.collection_id = col.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos para admin:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * getProductById
 * @description Obtiene un producto específico y todas sus variantes.
 */
export const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const variantsResult = await pool.query('SELECT * FROM product_variants WHERE product_id = $1', [id]);
        
        const product = productResult.rows[0];
        product.variants = variantsResult.rows;
        
        res.json(product);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * createProduct
 * @description Crea un producto y sus variantes dentro de una transacción ACID.
 * Gestiona la carga de imágenes y el cálculo automático de stock basado en variantes.
 */
export const createProduct = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: 'No se recibieron datos en la petición.' });
    }

    const { 
        title, description, price, category, sub_category,
        sku, stock, is_new, discount, featured, new_arrival, 
        parent_category, variants, launch_date, 
        lifecycle_state, priority, campaign_id,
        collection_id, layout_preference, admin_notes,
        tags, show_on_home
    } = req.body;
    
    // Normalización de rutas de imagen
    const image_url = req.files?.['image'] ? `/uploads/products/${req.files['image'][0].filename}` : req.body.image_url;
    const hover_image_url = req.files?.['hover_image'] ? `/uploads/products/${req.files['hover_image'][0].filename}` : req.body.hover_image_url;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Verificación de SKU único
        if (sku && sku.trim() !== '') {
            const skuCheck = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);
            if (skuCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(409).json({ error: `El SKU '${sku}' ya está en uso.` });
            }
        }
        
        // Normalización de valores para evitar errores de tipo en PostgreSQL
        const normalizedPrice = parseFloat(price) || 0;
        const normalizedStock = parseInt(stock) || 0;
        const normalizedDiscount = parseFloat(discount) || 0;
        const normalizedPriority = parseInt(priority) || 0;
        
        // Convertir strings vacíos a null para columnas UUID o fechas
        const nCampaignId = campaign_id && campaign_id !== '' ? campaign_id : null;
        const nCollectionId = collection_id && collection_id !== '' ? collection_id : null;
        const nLaunchDate = launch_date && launch_date !== '' ? launch_date : null;

        const productResult = await client.query(
            `INSERT INTO products 
            (title, description, price, category, sub_category, image_url, hover_image_url, sku, stock, is_new, discount, featured, new_arrival, parent_category, launch_date, lifecycle_state, priority, campaign_id, collection_id, layout_preference, admin_notes, tags, show_on_home) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) 
            RETURNING *`,
            [
                title, description, normalizedPrice, category, sub_category, image_url, hover_image_url, sku, normalizedStock, 
                is_new === 'true' || is_new === true, normalizedDiscount, featured === 'true' || featured === true, 
                new_arrival === 'true' || new_arrival === true, parent_category, 
                nLaunchDate, lifecycle_state || 'Published', normalizedPriority, nCampaignId,
                nCollectionId, layout_preference || 'standard', admin_notes || '',
                tags || '',
                show_on_home === 'true' || show_on_home === true
            ]
        );
        
        const product = productResult.rows[0];
        
        // Manejo de variantes
        let processedVariants = variants;
        if (typeof variants === 'string') {
            try { processedVariants = JSON.parse(variants); } catch (e) { processedVariants = []; }
        }

        if (processedVariants && Array.isArray(processedVariants) && processedVariants.length > 0) {
            let totalStock = 0;
            for (const variant of processedVariants) {
                totalStock += parseInt(variant.stock || 0);
                await client.query(
                    `INSERT INTO product_variants (product_id, size, color, stock, sku) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [product.id, variant.size, variant.color, parseInt(variant.stock) || 0, variant.sku]
                );
            }
            await client.query('UPDATE products SET stock = $1 WHERE id = $2', [totalStock, product.id]);
        }
        
        await client.query('COMMIT');
        res.status(201).json(product);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear el producto: ' + error.message });
    } finally {
        client.release();
    }
};

/**
 * updateProduct
 * @description Actualiza los datos de un producto y sus variantes.
 */
export const updateProduct = async (req, res) => {
    const { id } = req.params;

    if (!req.body) {
        return res.status(400).json({ error: 'No se recibieron datos.' });
    }

    const { 
        title, description, price, category, sub_category,
        sku, stock, is_new, discount, featured, new_arrival, 
        parent_category, variants, launch_date,
        lifecycle_state, priority, campaign_id,
        collection_id, layout_preference, admin_notes,
        tags, show_on_home
    } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Validación de SKU único
        if (sku && sku.trim() !== '') {
            const skuCheck = await client.query('SELECT id FROM products WHERE sku = $1 AND id != $2', [sku, id]);
            if (skuCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(409).json({ error: `El SKU '${sku}' ya está en uso.` });
            }
        }

        // Normalización de valores
        const normalizedPrice = parseFloat(price) || 0;
        const normalizedStock = parseInt(stock) || 0;
        const normalizedDiscount = parseFloat(discount) || 0;
        const normalizedPriority = parseInt(priority) || 0;
        
        const nCampaignId = campaign_id && campaign_id !== '' ? campaign_id : null;
        const nCollectionId = collection_id && collection_id !== '' ? collection_id : null;
        const nLaunchDate = launch_date && launch_date !== '' ? launch_date : null;
        
        // Construcción dinámica de la consulta SQL para actualización
        let queryFields = [
            'title = $1', 'description = $2', 'price = $3', 'category = $4', 'sub_category = $5',
            'sku = $6', 'stock = $7', 'is_new = $8', 'discount = $9', 'featured = $10',
            'new_arrival = $11', 'parent_category = $12', 'launch_date = $13',
            'lifecycle_state = $14', 'priority = $15', 'campaign_id = $16',
            'collection_id = $17', 'layout_preference = $18', 'admin_notes = $19',
            'tags = $20', 'show_on_home = $21'
        ];

        const values = [
            title, description, normalizedPrice, category, sub_category,
            sku, normalizedStock, is_new === 'true' || is_new === true,
            normalizedDiscount, featured === 'true' || featured === true,
            new_arrival === 'true' || new_arrival === true, parent_category, nLaunchDate,
            lifecycle_state || 'Published', normalizedPriority, nCampaignId,
            nCollectionId, layout_preference || 'standard', admin_notes || '',
            tags || '',
            show_on_home === 'true' || show_on_home === true
        ];

        let paramCount = values.length + 1;

        // Manejo de imágenes
        if (req.files?.['image']) {
            const image_url = `/uploads/products/${req.files['image'][0].filename}`;
            queryFields.push(`image_url = $${paramCount}`);
            values.push(image_url);
            paramCount++;
        } else if (req.body.image_url) {
            queryFields.push(`image_url = $${paramCount}`);
            values.push(req.body.image_url);
            paramCount++;
        }

        if (req.files?.['hover_image']) {
            const hover_image_url = `/uploads/products/${req.files['hover_image'][0].filename}`;
            queryFields.push(`hover_image_url = $${paramCount}`);
            values.push(hover_image_url);
            paramCount++;
        } else if (req.body.hover_image_url) {
            queryFields.push(`hover_image_url = $${paramCount}`);
            values.push(req.body.hover_image_url);
            paramCount++;
        }

        // Añadir el ID para el WHERE
        values.push(id);
        const idParamIndex = paramCount;

        const updateQuery = `
            UPDATE products 
            SET ${queryFields.join(', ')}
            WHERE id = $${idParamIndex}
            RETURNING *
        `;

        const result = await client.query(updateQuery, values);
        
        // Sincronización de Variantes
        let processedVariants = variants;
        if (typeof variants === 'string') {
            try { processedVariants = JSON.parse(variants); } catch (e) { processedVariants = []; }
        }

        if (processedVariants && Array.isArray(processedVariants) && processedVariants.length > 0) {
            await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
            let totalStock = 0;
            for (const variant of processedVariants) {
                totalStock += parseInt(variant.stock || 0);
                await client.query(
                    `INSERT INTO product_variants (product_id, size, color, stock, sku) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [id, variant.size, variant.color, parseInt(variant.stock) || 0, variant.sku]
                );
            }
            await client.query('UPDATE products SET stock = $1 WHERE id = $2', [totalStock, id]);
        } else if (processedVariants && Array.isArray(processedVariants) && processedVariants.length === 0) {
            // Si el array de variantes llega vacío, eliminamos las variantes existentes
            // El stock ya fue actualizado en la consulta principal de products
            await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto: ' + error.message });
    } finally {
        client.release();
    }
};


/**
 * deleteProduct
 * @description Elimina un producto de la base de datos y su imagen física del disco.
 */
export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const imagePath = product.rows[0].image_url;
        await pool.query('DELETE FROM products WHERE id = $1', [id]);

        // Eliminación física del archivo para optimizar almacenamiento
        if (imagePath && imagePath.startsWith('/uploads/')) {
            const absolutePath = path.join(process.cwd(), imagePath);
            if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
        }

        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * getCategories
 * @description Obtiene el listado de categorías únicas presentes en la BD.
 */
export const getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != \'\'');
        let categories = result.rows.map(row => row.category);
        
        if (categories.length === 0) {
            categories = ['clothing', 'accessories', 'featured'];
        }
        res.json(categories);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * getSubcategories
 * @description Obtiene el listado de subcategorías únicas presentes en la BD.
 */
export const getSubcategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT sub_category FROM products WHERE sub_category IS NOT NULL AND sub_category != \'\'');
        res.json(result.rows.map(row => row.sub_category));
    } catch (error) {
        console.error('Error al obtener subcategorías:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

