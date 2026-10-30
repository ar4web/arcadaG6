-- 007 — Auth hooks: provision a profile + default role on signup

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  -- Single-tenant deployments fall back to the first organization.
  select id into v_org from public.organizations order by created_at limit 1;

  insert into public.profiles (id, org_id, full_name, avatar_url, phone, locale)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'org_id')::uuid, v_org),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'locale', 'en')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data ->> 'role')::app_role, 'employee'))
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.locale/theme in sync with what the app writes locally.
create or replace function public.set_preferences(p_locale text default null, p_theme text default null)
returns public.profiles
language plpgsql
security invoker
as $$
declare
  v_profile public.profiles;
begin
  update public.profiles
     set locale = coalesce(p_locale, locale),
         theme = coalesce(p_theme, theme),
         last_seen_at = timezone('utc', now())
   where id = auth.uid()
   returning * into v_profile;
  return v_profile;
end;
$$;
