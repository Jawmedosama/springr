-- Offres ajoutées par les utilisateurs : un lien vers une annonce vue ailleurs, vérifié avant d'apparaître.
-- À coller une seule fois dans Supabase > SQL Editor, APRÈS employer-offers.sql. Rien à remplacer.
-- On ne garde que le lien et quelques mots tapés par l'utilisateur, jamais le texte de l'annonce.

alter table employer_offers add column kind text not null default 'employer' check (kind in ('employer','shared'));

alter table employer_offers drop constraint if exists employer_offers_description_check;
alter table employer_offers add constraint employer_offers_description_check
  check (length(description) <= 8000 and (kind = 'shared' or length(description) >= 50));
alter table employer_offers add constraint employer_offers_shared_https
  check (kind = 'employer' or (apply_url like 'https://%' and length(description) <= 300));

-- Au plus 5 liens partagés par compte et par jour.
create or replace function employer_offers_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from employer_offers where owner = new.owner and status = 'pending') >= 20 then
    raise exception 'Trop d''offres en attente';
  end if;
  if new.kind = 'shared' and (select count(*) from employer_offers where owner = new.owner and kind = 'shared' and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Limite de 5 offres partagées par jour';
  end if;
  return new;
end $$;
