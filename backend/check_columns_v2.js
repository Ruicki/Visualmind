import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'");
        const columns = res.rows.map(r => r.column_name);
        console.log('Columnas encontradas:', columns);
        
        const expected = ['sku', 'sub_category', 'stock', 'featured', 'new_arrival', 'parent_category'];
        const missing = expected.filter(c => !columns.includes(c));
        
        if (missing.length > 0) {
            console.log('Faltan columnas:', missing);
        } else {
            console.log('Todas las columnas necesarias están presentes.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
