-- Espace employeurs : les entreprises publient leurs offres, vérifiées avant d'apparaître.
-- À coller une seule fois dans Supabase > SQL Editor, APRÈS avoir remplacé TON-EMAIL
-- (2 fois) par l'adresse de ton compte sur le site : ce compte pourra valider les offres.

create table employer_offers (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  company text not null check (length(company) between 2 and 120),
  title text not null check (length(title) between 3 and 150),
  city text not null check (length(city) between 2 and 80),
  postcode char(4) check (postcode ~ '^[1-9][0-9]{3}$'),
  contract text not null check (contract in ('etudiant','flexi','stage','alternance','cdd','cdi','interim','nc')),
  regime text check (length(regime) <= 80),
  salary text check (length(salary) <= 80),
  description text not null check (length(description) between 50 and 8000),
  apply_url text not null check (apply_url ~ '^(https://|mailto:)' and length(apply_url) <= 500),
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now()
);

alter table employer_offers enable row level security;

-- Une entreprise voit, ajoute et retire ses offres, mais ne peut pas les publier elle-même.
create policy own_read on employer_offers for select to authenticated
  using ((select auth.uid()) = owner);
create policy own_insert on employer_offers for insert to authenticated
  with check ((select auth.uid()) = owner and status = 'pending');
create policy own_delete on employer_offers for delete to authenticated
  using ((select auth.uid()) = owner);
-- Tout le monde voit les offres validées.
create policy public_read on employer_offers for select to anon, authenticated
  using (status = 'published');
-- Le compte administrateur voit tout et valide ou refuse.
create policy admin_read on employer_offers for select to authenticated
  using ((select auth.jwt() ->> 'email') = 'TON-EMAIL');
create policy admin_update on employer_offers for update to authenticated
  using ((select auth.jwt() ->> 'email') = 'TON-EMAIL');

-- Au plus 20 offres en attente par compte, contre les abus.
create function employer_offers_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from employer_offers where owner = new.owner and status = 'pending') >= 20 then
    raise exception 'Trop d''offres en attente';
  end if;
  return new;
end $$;
create trigger employer_offers_limit before insert on employer_offers
  for each row execute function employer_offers_limit();
