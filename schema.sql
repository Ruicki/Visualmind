-- Reset Database (Use with caution - deletes data)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists products cascade;
drop table if exists profiles cascade;

-- Create Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  price numeric not null,
  category text not null,
  sub_category text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Orders Table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  total numeric not null,
  status text default 'pending', -- pending, shipped, delivered, cancelled
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Order Items Table
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id),
  quantity integer not null,
  price_at_purchase numeric not null 
);

-- Create Profiles Table for User Roles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'customer', -- 'admin' or 'customer'
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table profiles enable row level security;

-- Public Read for Products
create policy "Public Products are viewable by everyone"
  on products for select using ( true );

-- Admin CRUD for Products (simplification: allowed for authenticated users for now)
create policy "Auth users can insert products"
  on products for insert with check ( auth.role() = 'authenticated' );
create policy "Auth users can update products"
  on products for update using ( auth.role() = 'authenticated' );
create policy "Auth users can delete products"
  on products for delete using ( auth.role() = 'authenticated' );

-- Orders Policies
create policy "Users can see their own orders"
  on orders for select using ( auth.uid() = user_id );

-- Admin Orders Policy (simplification: allow auth users to see all for this prototype)
create policy "Auth users can view all orders"
  on orders for select using ( auth.role() = 'authenticated' );

-- Profiles Policies
create policy "Public profiles are viewable by everyone"
  on profiles for select using ( true );

create policy "Users can insert their own profile"
  on profiles for insert with check ( auth.uid() = id );
  
create policy "Users can update own profile"
  on profiles for update using ( auth.uid() = id );

-- Trigger for automatic profile creation on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  -- Check if this is the first user
  select count(*) = 0 into is_first_user from public.profiles;

  insert into public.profiles (id, email, role, full_name)
  values (
    new.id, 
    new.email, 
    CASE WHEN is_first_user THEN 'admin' ELSE 'customer' END,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;


-- Create Cart Items Table (for Persistence)
create table cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references products(id) not null,
  quantity integer default 1,
  variant_id text, -- string to identify unique combo of id+color+size
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, variant_id) -- Prevent duplicate rows for same item variant
);

alter table cart_items enable row level security;

create policy "Users can manage their own cart"
  on cart_items for all using ( auth.uid() = user_id );

