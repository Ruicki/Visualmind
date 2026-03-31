import pool from '../src/config/db.js';
import fs from 'fs';
import path from 'path';

export const getAllProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const getAdminProducts = async (req, res) => {
    try {
        // Obtenemos productos con conteo de variantes
        const result = await pool.query(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variants_count,
                   (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as variants_stock
            FROM products p 
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
        parent_category, variants, launch_date 
    } = req.body;
    
    const image_url = req.file ? `/uploads/products/${req.file.filename}` : req.body.image_url;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const productResult = await client.query(
            `INSERT INTO products 
            (title, description, price, category, sub_category, image_url, sku, stock, is_new, discount, featured, new_arrival, parent_category, launch_date) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
            RETURNING *`,
            [title, description, price, category, sub_category, image_url, sku, stock, is_new, discount, featured || false, new_arrival || false, parent_category, launch_date]
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
        parent_category, variants, launch_date 
    } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        let updateQuery = `
            UPDATE products 
            SET title = $1, description = $2, price = $3, category = $4, sub_category = $5, 
                sku = $6, stock = $7, is_new = $8, discount = $9, featured = $10, 
                new_arrival = $11, parent_category = $12, launch_date = $13
        `;
        let values = [title, description, price, category, sub_category, sku, stock, is_new, discount, featured, new_arrival, parent_category, launch_date];

        if (req.file) {
            const image_url = `/uploads/products/${req.file.filename}`;
            updateQuery += `, image_url = $14 WHERE id = $15 RETURNING *`;
            values.push(image_url, id);
        } else {
            updateQuery += ` WHERE id = $14 RETURNING *`;
            values.push(id);
        }

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
