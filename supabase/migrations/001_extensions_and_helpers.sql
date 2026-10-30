-- 001 — Extensions, helper functions and shared triggers
-- Every migration is idempotent so `supabase db reset` can be re-run safely.

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.tg_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tenant helpers — used by RLS policies throughout the schema.
-- SECURITY DEFINER so policies can read profiles without recursing.
-- ---------------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select p.org_id into v_org from public.profiles p where p.id = auth.uid();
  return v_org;
end;
$$;

create or replace function public.current_employee_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select p.employee_id into v_id from public.profiles p where p.id = auth.uid();
  return v_id;
end;
$$;

create or replace function public.has_role(variadic required_roles text[])
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role::text = any (required_roles)
  ) into v_ok;
  return coalesce(v_ok, false);
end;
$$;

create or replace function public.is_manager_of(target_employee uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1
    from public.employees e
    where e.id = target_employee
      and e.manager_id = public.current_employee_id()
  ) into v_ok;
  return coalesce(v_ok, false);
end;
$$;

-- Managers of a manager, up to 6 levels deep (org chart chains).
create or replace function public.manages_chain_of(target_employee uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_current uuid := target_employee;
  v_me uuid := public.current_employee_id();
  v_depth int := 0;
begin
  if v_me is null then
    return false;
  end if;
  while v_current is not null and v_depth < 6 loop
    select e.manager_id into v_current from public.employees e where e.id = v_current;
    if v_current = v_me then
      return true;
    end if;
    v_depth := v_depth + 1;
  end loop;
  return false;
end;
$$;

-- ---------------------------------------------------------------------------
-- Audit trail helper: attach to sensitive tables via triggers.
-- ---------------------------------------------------------------------------
create or replace function public.tg_audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text := lower(tg_op);
  v_entity text := tg_table_name;
  v_row_id text;
begin
  if tg_op = 'DELETE' then
    v_row_id := old.id::text;
    insert into public.audit_events (org_id, actor_id, actor_email, action, entity, entity_id, before, after)
    values (old.org_id, auth.uid(), coalesce(auth.jwt() ->> 'email', 'system'), v_action, v_entity, v_row_id, to_jsonb(old), null);
    return old;
  end if;

  v_row_id := new.id::text;
  insert into public.audit_events (org_id, actor_id, actor_email, action, entity, entity_id, before, after)
  values (
    new.org_id,
    auth.uid(),
    coalesce(auth.jwt() ->> 'email', 'system'),
    v_action,
    v_entity,
    v_row_id,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );
  return new;
end;
$$;

comment on function public.tg_audit_row() is 'Writes an audit_events row for every insert/update/delete on guarded tables.';
