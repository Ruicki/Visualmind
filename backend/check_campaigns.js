import pool from './src/config/db.js';
const res = await pool.query("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'campaigns'");
console.table(res.rows);
process.exit(0);
