import pool from './src/config/db.js';

const addShippingColumn = async () => {
    try {
        console.log('Adding shipping_details column to orders table...');
        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_details JSONB;');
        console.log('Success: Column added.');
        process.exit(0);
    } catch (error) {
        console.error('Error adding column:', error);
        process.exit(1);
    }
};

addShippingColumn();
