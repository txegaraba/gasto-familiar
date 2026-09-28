# Configuración de la aplicación

El engranaje aparece para miembros con `rol = 'administrador'` y `activo = true`.
Según el alcance solicitado, ese rol administra todas las familias, no solo la propia.

## Funciones

- Familias: crear y editar el nombre.
- Categorías por familia: crear, editar nombre y orden, activar y desactivar.
- Miembros por familia: editar nombre, rol y estado activo.
- Nuevos usuarios: crear una cuenta de Supabase Auth con email y contraseña,
  y asignarla como miembro activo de la familia seleccionada.

La creación no inicia sesión con la cuenta nueva ni envía emails. El administrador
entrega las credenciales al nuevo usuario. La cuenta queda confirmada para poder entrar.
Desactivar un miembro modifica `miembros_familia.activo`; no elimina ni bloquea su cuenta
de Auth. El acceso a los datos de miembros inactivos debe estar restringido por RLS.
Editar el nombre de un miembro no modifica el texto `persona` de gastos ya registrados.
No se modifica el presupuesto diario antiguo ni se eliminan familias o históricos.

## Netlify

La función `netlify/functions/crear-usuario.ts` requiere variables de entorno con
ámbito **Functions**: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
No utilizar el prefijo `VITE_` para la clave administrativa ni guardarla en el repositorio.
El usuario ha confirmado que estas variables están configuradas; no se han inspeccionado.
Tras cambiar variables hay que desplegar de nuevo.

La función valida el token contra Supabase Auth y consulta el rol activo en la base
de datos antes de crear cuentas. Si falla la inserción del miembro, intenta eliminar
la cuenta recién creada y comunica cualquier fallo de esa compensación.

`npm run dev` ejecuta también la función de creación mediante un middleware de Vite.
Para usarla en local, añadir `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` a `.env.local`
y reiniciar Vite. La URL puede reutilizar el valor de `VITE_SUPABASE_URL`.
Las variables de Netlify no se descargan automáticamente al entorno local.
La clave administrativa no debe llevar prefijo `VITE_`. `.env.local` está excluido de Git.

## Políticas de Supabase

Las consultas de familias, categorías y miembros usan la sesión del usuario y RLS.
Si las políticas actuales solo permiten leer la propia familia, no bastan para este panel.
La migración `supabase/migrations/20260928_configuracion_administradores.sql` añade
permisos de lectura y escritura para administradores activos. No se ha ejecutado remotamente.
Antes de aplicarla, revisar las políticas actuales mediante:

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('familias', 'categorias', 'miembros_familia');
```

Las políticas permisivas se combinan con OR: ninguna política existente debe permitir
a un usuario ordinario crear o cambiar su propio `rol` a administrador. La migración
añade permisos, pero no corrige políticas anteriores excesivamente amplias.
Mantener al menos un administrador activo al editar los miembros.

La creación de familias omite `presupuesto_diario`: ese campo antiguo debe admitir
omisión mediante su valor por defecto o nulabilidad. No participa en el nuevo presupuesto.

## Verificación

```sh
npm.cmd run build
node --test tests/presupuesto.test.ts tests/crear-usuario.test.ts
```

La compilación comprueba también la función de Netlify. Las pruebas de creación usan
respuestas simuladas; no crean usuarios reales ni verifican las políticas remotas.

Referencias: [creación administrativa de usuarios en Supabase](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
y [funciones de Netlify](https://docs.netlify.com/build/functions/get-started/).
