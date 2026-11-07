-- Notifications « nouvelles offres pour toi ».
-- À coller une seule fois dans Supabase > SQL Editor, APRÈS avoir remplacé CHANGE-MOI
-- par la même valeur que PUSH_SECRET dans Vercel.
-- La table n'est lisible par personne depuis le site : tout passe par les fonctions ci-dessous.

create table push_subs (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  lang text not null default 'fr' check (lang in ('fr','nl')),
  -- Recherche et filtres : jamais de nom, d'adresse ni d'e-mail.
  query jsonb not null default '{}',
  since timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table push_subs enable row level security;

create table push_secret (secret text primary key);
alter table push_secret enable row level security;

create function push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_lang text, p_query jsonb)
returns void language sql security definer set search_path = public as $$
  insert into push_subs (endpoint, p256dh, auth, lang, query)
  values (p_endpoint, p_p256dh, p_auth, p_lang, coalesce(p_query, '{}'))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang, query = excluded.query;
$$;

create function push_unsubscribe(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from push_subs where endpoint = p_endpoint;
$$;

create function push_list(p_secret text)
returns setof push_subs language sql security definer set search_path = public as $$
  select s.* from push_subs s where exists (select 1 from push_secret where secret = p_secret) order by s.since limit 500;
$$;

create function push_mark(p_secret text, p_endpoint text, p_gone boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from push_secret where secret = p_secret) then return; end if;
  if p_gone then delete from push_subs where endpoint = p_endpoint;
  else update push_subs set since = now() where endpoint = p_endpoint; end if;
end $$;

revoke all on function push_list(text), push_mark(text, text, boolean) from public;
grant execute on function push_list(text), push_mark(text, text, boolean) to anon;

insert into push_secret values ('CHANGE-MOI');
