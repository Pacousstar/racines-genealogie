-- Témoignages audio de la généalogie (Racines+)
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard → SQL Editor).

create table if not exists public.temoignages (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references public.personnes (id) on delete cascade,
  titre text,
  audio_url text not null,
  duree integer,
  cree_le timestamptz not null default now(),
  cree_par uuid references auth.users (id)
);

create index if not exists temoignages_personne_idx on public.temoignages (personne_id, cree_le desc);

alter table public.temoignages enable row level security;

drop policy if exists "temoignages_lecture" on public.temoignages;
create policy "temoignages_lecture"
  on public.temoignages for select
  to authenticated
  using (true);

drop policy if exists "temoignages_insertion" on public.temoignages;
create policy "temoignages_insertion"
  on public.temoignages for insert
  to authenticated
  with check (true);