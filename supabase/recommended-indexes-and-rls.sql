-- Índices compatíveis com as consultas executadas pelo frontend.
create index if not exists profiles_public_recent_idx
  on public.profiles (is_public, last_collection_update desc);

create index if not exists profiles_clan_tag_idx
  on public.profiles (clan_tag) where is_public = true;

create index if not exists user_cards_user_id_idx
  on public.user_cards (user_id);

-- A tag do jogador precisa ser única para o tratamento de duplicidade da aplicação.
create unique index if not exists profiles_clash_player_tag_unique_idx
  on public.profiles (clash_player_tag);

alter table public.profiles enable row level security;
alter table public.user_cards enable row level security;

-- Audite as políticas já existentes antes de publicar. Este arquivo não as recria
-- para evitar colisão com os nomes/políticas do projeto Supabase já configurado.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('profiles', 'user_cards')
order by tablename, policyname;

-- Requisitos mínimos das políticas:
-- profiles SELECT: is_public = true OR auth.uid() = id
-- profiles INSERT/UPDATE/DELETE: auth.uid() = id (USING e WITH CHECK)
-- user_cards SELECT: user_id = auth.uid() OR EXISTS (
--   SELECT 1 FROM profiles p WHERE p.id = user_id AND p.is_public = true
-- )
-- user_cards INSERT/UPDATE/DELETE: auth.uid() = user_id (USING e WITH CHECK)
