-- Tabla de Usuarios (Sustituto de Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    sub_category VARCHAR(100),
    image_url VARCHAR(255),
    sku VARCHAR(100) UNIQUE,
    stock INTEGER DEFAULT 0,
    is_new BOOLEAN DEFAULT false,
    discount DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Órdenes
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, delivered, cancelled
    items JSONB NOT NULL, -- Lista de productos en la orden
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserción de admin por defecto
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@visualmind.com', '$2a$10$wE9sI/lRHz4QosX3d069/uqkM/fL1J1B8iA4VbU.3b04c8K07A5T2', 'Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

