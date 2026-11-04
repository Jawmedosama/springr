-- Schéma Supabase (Postgres, région UE) pour les comptes Springr.
-- À coller une seule fois dans Supabase > SQL Editor.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  birth_date date not null,
  street text not null,
  house_number text not null,
  postcode char(4) not null check (postcode ~ '^[1-9][0-9]{3}$' and postcode::int <= 9992),
  city text not null,
  region text not null check (region in ('bruxelles','wallonie','flandre')),
  declared_resident boolean not null check (declared_resident),
  study_level text,
  field text,
  skills text[] not null default '{}',
  languages text[] not null default '{}',
  contracts text[] not null default '{}',
  mobility_km int not null default 30,
  cv_text text,
  created_at timestamptz not null default now()
  -- L'âge (16 à 35 ans) est vérifié à l'inscription par l'application, pas par une contrainte,
  -- car il change avec le temps.
);

-- L'offre est copiée dans la candidature : une annonce peut disparaître de sa source.
create table applications (
  user_id uuid not null references profiles on delete cascade,
  offer_id text not null,
  offer jsonb not null,
  status text not null default 'a_postuler'
    check (status in ('a_postuler','envoyee','entretien','refusee','acceptee')),
  remind_at date,
  notes text,
  letter text,
  cv text,
  spontaneous boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

create table seen_offers (
  user_id uuid not null references profiles on delete cascade,
  offer_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

-- Chaque personne ne voit et ne modifie que ses propres données.
alter table profiles enable row level security;
alter table applications enable row level security;
alter table seen_offers enable row level security;

create policy own_profile on profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy own_apps on applications for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_seen on seen_offers for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Droit à l'effacement : supprime le compte, et par cascade toutes ses données.
create function delete_my_account() returns void
language sql security definer set search_path = ''
as $$ delete from auth.users where id = (select auth.uid()); $$;

revoke execute on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;
