-- Schéma Supabase (Postgres, région UE) pour remplacer le stockage local du prototype.
create extension if not exists vector;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  street text not null,
  house_number text not null,
  postcode char(4) not null check (postcode ~ '^[1-9][0-9]{3}$'),
  city text not null,
  region text not null check (region in ('bruxelles','wallonie','flandre')),
  declared_resident boolean not null default false,
  residence_verified_by text, -- 'email', plus tard 'itsme' ou 'eid'
  study_level text,
  field text,
  skills text[] default '{}',
  languages text[] default '{}',
  contracts text[] default '{}',
  mobility_km int default 30,
  ui_lang text not null default 'fr' check (ui_lang in ('fr','nl')),
  matching_enabled boolean not null default true, -- droit de désactiver le profilage
  created_at timestamptz not null default now()
  -- L'âge (16 à 35 ans) est vérifié à l'inscription par l'application, pas par une contrainte,
  -- car il change avec le temps.
);

create table offers (
  id text primary key,            -- ex. 'adzuna-123', 'forem-456'
  source text not null,
  title text not null,
  company text,
  city text,
  postcode char(4),
  region text,
  contract text not null,
  description text,
  language text,
  url text not null,
  salary text,
  published_at timestamptz,
  dedupe_key text not null,
  embedding vector(1024),
  fetched_at timestamptz not null default now()
);
create unique index offers_dedupe on offers (dedupe_key);

create table applications (
  user_id uuid references profiles on delete cascade,
  offer_id text references offers on delete cascade,
  status text not null default 'a_postuler',
  remind_at date,
  notes text,
  updated_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

create table swipes (
  user_id uuid references profiles on delete cascade,
  offer_id text references offers on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

-- Chaque personne ne voit et ne modifie que ses propres données.
alter table profiles enable row level security;
alter table applications enable row level security;
alter table swipes enable row level security;
create policy own_profile on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy own_apps on applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_swipes on swipes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table offers enable row level security;
create policy read_offers on offers for select using (true);
