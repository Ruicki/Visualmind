import pool from './src/config/db.js';
import { PRODUCTS } from '../frontend/src/data/products.js';
import dotenv from 'dotenv';
dotenv.config();

const seed = async () => {
    try {
        console.log('Seeding products...');
        for (const p of PRODUCTS) {
            await pool.query(
                'INSERT INTO products (id, title, description, price, category, sub_category, image_url, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url, sub_category = EXCLUDED.sub_category',
                [p.id, p.title, p.description || '', p.price, p.category, p.subCategory || '', p.image, 10]
            );
        }
        console.log('✅ 8 products seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seed();
