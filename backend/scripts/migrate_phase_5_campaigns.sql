-- Script de migración para la Fase 5: Evolución E-commerce
-- Ejecutar en PostgreSQL

-- 1. Crear tabla de campañas
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    banner_url VARCHAR(500),
    accent_color VARCHAR(50) DEFAULT '#ff4d4d',
    template_type VARCHAR(50) DEFAULT 'grid', -- grid, editorial, masonry
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    countdown_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Añadir campos a la tabla de productos para ciclo de vida y marketing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS lifecycle_state VARCHAR(50) DEFAULT 'Published', -- Draft, Published, Legacy, Archived
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- 3. Crear una campaña inicial (ejemplo: Anime Season)
INSERT INTO campaigns (name, slug, description, accent_color, is_active)
VALUES ('Anime Standard', 'anime-standard', 'Colección base de anime', '#ffffff', true)
ON CONFLICT (slug) DO NOTHING;
