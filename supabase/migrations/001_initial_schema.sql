-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  deadline date,
  status text not null default 'PENDING',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order Items (individual pieces)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  piece_type text not null,
  quantity int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Customisations per piece
create table customisations (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) on delete cascade,
  key text not null,
  value text not null,
  created_at timestamptz default now()
);

-- Measurements per piece
create table measurements (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) on delete cascade,
  key text not null,
  value text not null,
  created_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

create trigger order_items_updated_at before update on order_items
  for each row execute function update_updated_at();