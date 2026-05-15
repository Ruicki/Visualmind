-- =============================================================================
-- Visualmind Database Schema
-- Base de datos PostgreSQL para el MVP de Visualmind.
-- Sin referencias a Supabase (auth.users, RLS, GRANT).
-- Usar con PostgreSQL 14+ (requiere gen_random_uuid() de pgcrypto o pg 13+).
-- =============================================================================

-- Usuarios del sistema (clientes y administradores)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255),
  role          VARCHAR(50) DEFAULT 'customer',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo de productos de la tienda
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2) NOT NULL,
  category        VARCHAR(100),
  sub_category    VARCHAR(100),
  parent_category VARCHAR(100),
  image_url       VARCHAR(500),
  sku             VARCHAR(100) UNIQUE,
  stock           INTEGER DEFAULT 0,
  is_new          BOOLEAN DEFAULT false,
  discount        DECIMAL(5,2) DEFAULT 0,
  featured        BOOLEAN DEFAULT false,
  new_arrival     BOOLEAN DEFAULT false,
  launch_date     DATE,
  tags            VARCHAR(500),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes de producto (talla, color, stock por variante)
CREATE TABLE IF NOT EXISTS product_variants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size       VARCHAR(20),
  color      VARCHAR(50),
  stock      INTEGER DEFAULT 0,
  sku        VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Órdenes de compra realizadas por los usuarios
CREATE TABLE IF NOT EXISTS orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES users(id) ON DELETE SET NULL,
  items                    JSONB NOT NULL,
  total                    DECIMAL(10,2) NOT NULL,
  status                   VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Ítems individuales de cada orden (para reportes y stock)
CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id        UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity          INTEGER NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL
);

-- Direcciones de envío guardadas por los usuarios
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  full_name    VARCHAR(255) NOT NULL,
  address_line VARCHAR(500) NOT NULL,
  city         VARCHAR(100) NOT NULL,
  province     VARCHAR(100),
  postal_code  VARCHAR(20),
  country      VARCHAR(100) DEFAULT 'Panama',
  is_default   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Registro de cambios de stock para auditoría
CREATE TABLE IF NOT EXISTS stock_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  change     INTEGER NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cupones de descuento aplicables al checkout
CREATE TABLE IF NOT EXISTS coupons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(50) UNIQUE NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  max_uses         INTEGER,
  used_count       INTEGER DEFAULT 0,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Campañas de marketing (banners dinámicos, cuenta regresiva)
CREATE TABLE IF NOT EXISTS campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) UNIQUE,
  description       TEXT,
  banner_url        VARCHAR(500),
  accent_color      VARCHAR(50),
  template_type     VARCHAR(50) DEFAULT 'grid',
  start_date        TIMESTAMPTZ,
  end_date          TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT false,
  countdown_enabled BOOLEAN DEFAULT false,
  type              VARCHAR(50) DEFAULT 'campaign',
  button_text       VARCHAR(100),
  button_link       VARCHAR(255),
  updated_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Temporadas (colecciones estacionales: Halloween, Anime Season, etc.)
CREATE TABLE IF NOT EXISTS seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE,
  description TEXT,
  start_date  TIMESTAMPTZ,
  end_date    TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT false,
  updated_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías dinámicas para los productos
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  icon        VARCHAR(50),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Colecciones de productos (agrupaciones editoriales)
CREATE TABLE IF NOT EXISTS collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE,
  description TEXT,
  image_url   VARCHAR(500),
  is_active   BOOLEAN DEFAULT true,
  updated_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Slots de productos destacados para el carousel de la home
CREATE TABLE IF NOT EXISTS featured_product_slots (
  id           SERIAL PRIMARY KEY,
  slot_order   INTEGER NOT NULL UNIQUE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  rotation     VARCHAR(20) DEFAULT 'weekly',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Columnas adicionales en products para lifecycle, campañas y temporadas
-- (Se agregan con IF NOT EXISTS para no fallar si ya existen)
DO $
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='lifecycle_state') THEN
    ALTER TABLE products ADD COLUMN lifecycle_state VARCHAR(50) DEFAULT 'Published';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='priority') THEN
    ALTER TABLE products ADD COLUMN priority INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='campaign_id') THEN
    ALTER TABLE products ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='season_id') THEN
    ALTER TABLE products ADD COLUMN season_id UUID REFERENCES seasons(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='collection_id') THEN
    ALTER TABLE products ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='hover_image_url') THEN
    ALTER TABLE products ADD COLUMN hover_image_url VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='layout_preference') THEN
    ALTER TABLE products ADD COLUMN layout_preference VARCHAR(50) DEFAULT 'standard';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='admin_notes') THEN
    ALTER TABLE products ADD COLUMN admin_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_details') THEN
    ALTER TABLE orders ADD COLUMN shipping_details JSONB;
  END IF;
  -- Columna campaign_id en featured_product_slots para slots por campaña
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='featured_product_slots' AND column_name='campaign_id') THEN
    ALTER TABLE featured_product_slots ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;
    ALTER TABLE featured_product_slots DROP CONSTRAINT featured_product_slots_slot_order_key;
    ALTER TABLE featured_product_slots ADD UNIQUE (campaign_id, slot_order);
  END IF;
  -- Columnas adicionales en campaigns añadidas en fases posteriores
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='type') THEN
    ALTER TABLE campaigns ADD COLUMN type VARCHAR(50) DEFAULT 'campaign';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='button_text') THEN
    ALTER TABLE campaigns ADD COLUMN button_text VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='button_link') THEN
    ALTER TABLE campaigns ADD COLUMN button_link VARCHAR(255);
  END IF;
  -- Columnas añadidas en home-hero-products-redesign
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='secondary_images') THEN
    ALTER TABLE campaigns ADD COLUMN secondary_images JSONB DEFAULT '[]';
  END IF;
  -- Columna description_long en collections para la sección editorial del home
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collections' AND column_name='description_long') THEN
    ALTER TABLE collections ADD COLUMN description_long TEXT;
  END IF;
  -- Columna show_on_home en products para seleccionar los que aparecen en la home
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='show_on_home') THEN
    ALTER TABLE products ADD COLUMN show_on_home BOOLEAN DEFAULT false;
  END IF;
END $;
