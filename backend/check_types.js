import pool from './src/config/db.js';
const res = await pool.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'campaigns'");
console.table(res.rows);
process.exit(0);
