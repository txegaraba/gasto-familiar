-- Revisar las políticas existentes antes de aplicar en Supabase.
-- No elimina ni sustituye las políticas de acceso de los usuarios habituales.
-- El rol administrador activo permite gestionar TODAS las familias.
begin;

create or replace function public.es_administrador_app()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.miembros_familia
    where usuario_id = (select auth.uid())
      and rol = 'administrador'
      and activo = true
  );
$$;

revoke all on function public.es_administrador_app() from public;
grant execute on function public.es_administrador_app() to authenticated;

alter table public.familias enable row level security;
alter table public.categorias enable row level security;
alter table public.miembros_familia enable row level security;

create policy "admin_app_leer_familias" on public.familias
for select to authenticated using ((select public.es_administrador_app()));
create policy "admin_app_crear_familias" on public.familias
for insert to authenticated with check ((select public.es_administrador_app()));
create policy "admin_app_editar_familias" on public.familias
for update to authenticated
using ((select public.es_administrador_app()))
with check ((select public.es_administrador_app()));

create policy "admin_app_leer_categorias" on public.categorias
for select to authenticated using ((select public.es_administrador_app()));
create policy "admin_app_crear_categorias" on public.categorias
for insert to authenticated with check ((select public.es_administrador_app()));
create policy "admin_app_editar_categorias" on public.categorias
for update to authenticated
using ((select public.es_administrador_app()))
with check ((select public.es_administrador_app()));

create policy "admin_app_leer_miembros" on public.miembros_familia
for select to authenticated using ((select public.es_administrador_app()));
create policy "admin_app_editar_miembros" on public.miembros_familia
for update to authenticated
using ((select public.es_administrador_app()))
with check ((select public.es_administrador_app()));

commit;
