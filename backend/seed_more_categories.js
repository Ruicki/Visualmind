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

const moreCategories = [
    { name: 'Streetwear', slug: 'streetwear', icon: '🛹', description: 'Estilo urbano y moda callejera.' },
    { name: 'Vintage', slug: 'vintage', icon: '📻', description: 'Diseños retro y nostálgicos.' },
    { name: 'Deportes', slug: 'sports', icon: '⚽', description: 'Ropa deportiva y atlética.' },
    { name: 'Minimalista', slug: 'minimalist', icon: '⚪', description: 'Diseños simples, limpios y elegantes.' },
    { name: 'Fotografía', slug: 'photography', icon: '📷', description: 'Estampados de fotos y cámaras.' },
    { name: 'Naturaleza', slug: 'nature', icon: '🌿', description: 'Plantas, paisajes y mundo natural.' },
    { name: 'Mascotas', slug: 'pets', icon: '🐾', description: 'Diseños para amantes de perros y gatos.' },
    { name: 'Kawaii', slug: 'kawaii', icon: '🌸', description: 'Estilo tierno, colores pastel y lindo.' },
    { name: 'Terror / Horror', slug: 'horror', icon: '👻', description: 'Diseños oscuros, Halloween y terror.' },
    { name: 'Cyberpunk', slug: 'cyberpunk', icon: '🤖', description: 'Futurismo, neón y sci-fi.' },
    { name: 'Tipografía', slug: 'typography', icon: '✍️', description: 'Frases, letras y citas inspiradoras.' },
    { name: 'Espacio', slug: 'space', icon: '🌌', description: 'Astrología, planetas y galaxias.' },
    { name: 'Fantasía', slug: 'fantasy', icon: '🐉', description: 'Dragones, magia y mundos épicos.' },
    { name: 'Retro 80s/90s', slug: 'retro', icon: '🕹️', description: 'Vibras de los ochentas y noventas.' },
    { name: 'Fitness', slug: 'fitness', icon: '💪', description: 'Ropa para el gimnasio y motivación.' },
    { name: 'Comida', slug: 'food', icon: '🍕', description: 'Diseños divertidos de comida.' },
    { name: 'Viajes', slug: 'travel', icon: '✈️', description: 'Aventuras, mapas y exploración.' },
    { name: 'Motor', slug: 'motor', icon: '🏎️', description: 'Coches, motos y carreras.' },
    { name: 'Humor y Memes', slug: 'humor', icon: '😂', description: 'Diseños chistosos y referencias de internet.' },
    { name: 'Matching (Parejas)', slug: 'matching', icon: '💞', description: 'Ropa a juego para parejas o amigos.' }
];

async function run() {
  try {
    await client.connect();
    let count = 0;
    for (const cat of moreCategories) {
        const res = await client.query(
            'INSERT INTO categories (name, slug, icon, description) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING RETURNING id',
            [cat.name, cat.slug, cat.icon, cat.description]
        );
        if (res.rowCount > 0) count++;
    }
    console.log(`✅ ${count} nuevas categorías insertadas exitosamente.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
