import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a PostgreSQL
// Soporta tanto una URL completa (estándar en la nube) como parámetros individuales (local)
const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

// Probar la conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error adquiriendo cliente de PostgreSQL', err.stack);
  }
  console.log('✅ Conexión a PostgreSQL establecida exitosamente');
  release();
});

export default pool;
