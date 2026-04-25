import pool from '../src/config/db.js';
import fs from 'fs';
import path from 'path';

export const getAllProducts = async (req, res) => {
    try {
        // Públicamente solo mostramos productos publicados y legacy
        const result = await pool.query(`
            SELECT p.*, s.end_date as season_end_date, s.is_active as season_is_active
            FROM products p
            LEFT JOIN seasons s ON p.season_id = s.id
            WHERE p.lifecycle_state IN ('Published', 'Legacy') 
            ORDER BY p.priority DESC, p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const getAdminProducts = async (req, res) => {
    try {
        // Obtenemos productos con conteo de variantes y relaciones de temporada/colección
        const result = await pool.query(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variants_count,
                   (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as variants_stock,
                   c.name as campaign_name,
                   s.name as season_name,
                   col.name as collection_name
            FROM products p 
            LEFT JOIN campaigns c ON p.campaign_id = c.id
            LEFT JOIN seasons s ON p.season_id = s.id
            LEFT JOIN collections col ON p.collection_id = col.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos para admin:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

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

export const createProduct = async (req, res) => {
    const { 
        title, description, price, category, sub_category,
        sku, stock, is_new, discount, featured, new_arrival, 
        parent_category, variants, launch_date, 
        lifecycle_state, priority, campaign_id,
        season_id, collection_id, layout_preference, admin_notes
    } = req.body;
    
    const image_url = req.files?.['image'] ? `/uploads/products/${req.files['image'][0].filename}` : req.body.image_url;
    const hover_image_url = req.files?.['hover_image'] ? `/uploads/products/${req.files['hover_image'][0].filename}` : req.body.hover_image_url;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const productResult = await client.query(
            `INSERT INTO products 
            (title, description, price, category, sub_category, image_url, hover_image_url, sku, stock, is_new, discount, featured, new_arrival, parent_category, launch_date, lifecycle_state, priority, campaign_id, season_id, collection_id, layout_preference, admin_notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) 
            RETURNING *`,
            [
                title, description, price, category, sub_category, image_url, hover_image_url, sku, stock, 
                is_new, discount, featured || false, new_arrival || false, parent_category, 
                launch_date, lifecycle_state || 'Published', priority || 0, campaign_id || null,
                season_id || null, collection_id || null, layout_preference || 'standard', admin_notes || ''
            ]
        );
        
        const product = productResult.rows[0];
        
        if (variants && Array.isArray(variants) && variants.length > 0) {
            let totalStock = 0;
            for (const variant of variants) {
                totalStock += parseInt(variant.stock || 0);
                await client.query(
                    `INSERT INTO product_variants (product_id, size, color, stock, sku) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [product.id, variant.size, variant.color, variant.stock, variant.sku]
                );
            }
            // Actualizar stock total del producto basado en variantes
            await client.query(
                'UPDATE products SET stock = $1 WHERE id = $2',
                [totalStock, product.id]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json(product);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear el producto' });
    } finally {
        client.release();
    }
};

export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { 
        title, description, price, category, sub_category,
        sku, stock, is_new, discount, featured, new_arrival, 
        parent_category, variants, launch_date,
        lifecycle_state, priority, campaign_id,
        season_id, collection_id, layout_preference, admin_notes
    } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        let updateQuery = `
            UPDATE products 
            SET title = $1, description = $2, price = $3, category = $4, sub_category = $5, 
                sku = $6, stock = $7, is_new = $8, discount = $9, featured = $10, 
                new_arrival = $11, parent_category = $12, launch_date = $13,
                lifecycle_state = $14, priority = $15, campaign_id = $16,
                season_id = $17, collection_id = $18, layout_preference = $19, admin_notes = $20
        `;
        let values = [
            title, description, price, category, sub_category, sku, stock, is_new, 
            discount, featured, new_arrival, parent_category, launch_date,
            lifecycle_state, priority, campaign_id,
            season_id, collection_id, layout_preference, admin_notes
        ];

        let paramCount = 21;
        
        if (req.files?.['image']) {
            const image_url = `/uploads/products/${req.files['image'][0].filename}`;
            updateQuery += `, image_url = $${paramCount}`;
            values.push(image_url);
            paramCount++;
        } else if (req.body.image_url) {
            updateQuery += `, image_url = $${paramCount}`;
            values.push(req.body.image_url);
            paramCount++;
        }

        if (req.files?.['hover_image']) {
            const hover_image_url = `/uploads/products/${req.files['hover_image'][0].filename}`;
            updateQuery += `, hover_image_url = $${paramCount}`;
            values.push(hover_image_url);
            paramCount++;
        } else if (req.body.hover_image_url) {
            updateQuery += `, hover_image_url = $${paramCount}`;
            values.push(req.body.hover_image_url);
            paramCount++;
        }

        updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
        values.push(id);

        const result = await client.query(updateQuery, values);
        
        if (variants && Array.isArray(variants)) {
            await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
            let totalStock = 0;
            for (const variant of variants) {
                totalStock += parseInt(variant.stock || 0);
                await client.query(
                    `INSERT INTO product_variants (product_id, size, color, stock, sku) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [id, variant.size, variant.color, variant.stock, variant.sku]
                );
            }
            // Actualizar stock total del producto basado en variantes
            await client.query(
                'UPDATE products SET stock = $1 WHERE id = $2',
                [totalStock, id]
            );
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error del servidor' });
    } finally {
        client.release();
    }
};

export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const imagePath = product.rows[0].image_url;
        await pool.query('DELETE FROM products WHERE id = $1', [id]);

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

export const getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != \'\'');
        let categories = result.rows.map(row => row.category);
        
        // Fallback si no hay productos
        if (categories.length === 0) {
            categories = ['action', 'figures', 'posters', 'clothing', 'accessories'];
        }
        res.json(categories);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const getSubcategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT sub_category FROM products WHERE sub_category IS NOT NULL AND sub_category != \'\'');
        res.json(result.rows.map(row => row.sub_category));
    } catch (error) {
        console.error('Error al obtener subcategorías:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};
