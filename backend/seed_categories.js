import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const defaultCategories = [
    { name: 'Anime', slug: 'anime', icon: '🎌', description: 'Diseños inspirados en el mundo del anime y manga.' },
    { name: 'Arte', slug: 'art', icon: '🎨', description: 'Colección de diseños artísticos y únicos.' },
    { name: 'Música', slug: 'music', icon: '🎵', description: 'Cultura musical, bandas y géneros.' },
    { name: 'Pop Culture', slug: 'pop_culture', icon: '🍿', description: 'Cine, series y cultura pop.' },
    { name: 'Tecnología', slug: 'tech', icon: '💻', description: 'Geek culture y tecnología.' },
    { name: 'Gaming', slug: 'gaming', icon: '🎮', description: 'Para amantes de los videojuegos.' },
    { name: 'Personalizado', slug: 'custom', icon: '✨', description: 'Pedidos y diseños especiales hechos a medida.' }
];

async function run() {
  try {
    await client.connect();
    for (const cat of defaultCategories) {
        await client.query(
            'INSERT INTO categories (name, slug, icon, description) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING',
            [cat.name, cat.slug, cat.icon, cat.description]
        );
    }
    console.log('✅ Categorías base insertadas exitosamente.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
