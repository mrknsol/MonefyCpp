create table if not exists users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  password_salt text not null,
  first_name text not null,
  last_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

alter table users add column if not exists phone text;

create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists cards (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  card_number text not null unique,
  holder_first_name text not null,
  holder_last_name text not null default '',
  month_of_expiry text not null default '',
  year_of_expiry text not null default '',
  cvv text not null default '',
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id text primary key,
  label text not null,
  icon_name text not null default 'Custom',
  icon_color text not null default '#888888',
  type text not null default 'expense'
);

create table if not exists transactions (
  id bigserial primary key,
  card_id uuid not null references cards(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  amount numeric(14,2) not null,
  category_id text references categories(id),
  description text not null default '',
  icon_name text not null default 'Custom',
  icon_color text not null default '#888888',
  payment_card text not null,
  operation_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists transfers (
  id bigserial primary key,
  from_card_id uuid not null references cards(id),
  to_card_id uuid references cards(id),
  from_user_id uuid not null references users(id),
  to_user_id uuid references users(id),
  external_card_number text,
  external_recipient_name text,
  amount numeric(14,2) not null,
  description text not null default '',
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

insert into categories (id, label, icon_name, icon_color, type) values
  ('Pets', 'Pets', 'Dog', '#F97316', 'expense'),
  ('Connection', 'Connection', 'Phone', '#06B6D4', 'expense'),
  ('Restaurant', 'Restaurant', 'Restaurant', '#EF4444', 'expense'),
  ('Taxi', 'Taxi', 'Car', '#F59E0B', 'expense'),
  ('Clothes', 'Clothes', 'ClothesHanger', '#8B5CF6', 'expense'),
  ('Beverages', 'Beverages', 'Beverages', '#14B8A6', 'expense'),
  ('Transportation', 'Transportation', 'Transportation', '#3B82F6', 'expense'),
  ('Home', 'Home', 'Home', '#10B981', 'expense'),
  ('Hygiene', 'Hygiene', 'OralHygiene', '#EC4899', 'expense'),
  ('Sport', 'Sport', 'YoutubeSports', '#22C55E', 'expense'),
  ('Gift', 'Gift', 'Gift', '#EAB308', 'expense'),
  ('Health', 'Health', 'HealthPotion', '#EF4444', 'expense'),
  ('CarRepair', 'Car', 'CarRepair', '#64748B', 'expense'),
  ('Market', 'Market', 'Marketplace', '#84CC16', 'expense'),
  ('TopUp', 'Top-up', 'TopUp', '#059669', 'income'),
  ('Transfer', 'Transfer', 'Transfer', '#2563EB', 'transfer')
on conflict (id) do nothing;
