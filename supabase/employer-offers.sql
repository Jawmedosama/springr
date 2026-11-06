-- Espace entreprises : à appliquer seulement quand le propriétaire du projet l'aura décidé.
create table employer_offers (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users on delete cascade,
  company text not null,
  title text not null,
  city text not null,
  postcode char(4),
  contract text not null,
  description text not null,
  apply_url text not null,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now()
);

alter table employer_offers enable row level security;

-- Une entreprise gère ses offres, et ne peut pas les publier elle-même.
create policy own_offers_read on employer_offers for select to authenticated
  using ((select auth.uid()) = owner);
create policy own_offers_insert on employer_offers for insert to authenticated
  with check ((select auth.uid()) = owner and status = 'pending');
create policy public_offers on employer_offers for select to anon, authenticated
  using (status = 'published');
