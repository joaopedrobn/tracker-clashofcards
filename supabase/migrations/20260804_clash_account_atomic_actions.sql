create unique index if not exists clash_accounts_one_primary_per_owner
on public.clash_accounts (owner_id)
where is_primary;

create or replace function public.set_primary_clash_account(p_account_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1 from public.clash_accounts
    where id = p_account_id and owner_id = v_owner_id
  ) then
    raise exception 'CLASH_ACCOUNT_NOT_FOUND';
  end if;

  update public.clash_accounts
  set is_primary = false, updated_at = now()
  where owner_id = v_owner_id and is_primary and id <> p_account_id;

  update public.clash_accounts
  set is_primary = true, updated_at = now()
  where id = p_account_id and owner_id = v_owner_id;
end;
$$;

create or replace function public.delete_own_clash_account(p_account_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
  v_was_primary boolean;
  v_next_id uuid;
begin
  if v_owner_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select is_primary into v_was_primary
  from public.clash_accounts
  where id = p_account_id and owner_id = v_owner_id
  for update;

  if not found then
    raise exception 'CLASH_ACCOUNT_NOT_FOUND';
  end if;

  if (select count(*) from public.clash_accounts where owner_id = v_owner_id) <= 1 then
    raise exception 'LAST_CLASH_ACCOUNT_CANNOT_BE_DELETED';
  end if;

  delete from public.account_cards
  where account_id = p_account_id;

  delete from public.clash_accounts
  where id = p_account_id and owner_id = v_owner_id;

  if v_was_primary then
    select id into v_next_id
    from public.clash_accounts
    where owner_id = v_owner_id
    order by display_order, created_at
    limit 1
    for update;

    update public.clash_accounts
    set is_primary = (id = v_next_id), updated_at = now()
    where owner_id = v_owner_id;
  end if;
end;
$$;

revoke all on function public.set_primary_clash_account(uuid) from public;
revoke all on function public.delete_own_clash_account(uuid) from public;
grant execute on function public.set_primary_clash_account(uuid) to authenticated;
grant execute on function public.delete_own_clash_account(uuid) to authenticated;
