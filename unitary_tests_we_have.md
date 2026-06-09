# Tests Unitarios Implementados

Este documento resume los tests unitarios que ya existen en el proyecto y que no dependen de funcionalidades placeholder.

## Estado Actual

- Total de tests implementados y ejecutados: `22`
- Backend: `19`
- Frontend: `3`

## Backend

### Auth Service

Archivo:

`backend/src/modules/auth/auth.service.test.ts`

Casos cubiertos:

- `authService.login` recorta espacios del `username` antes de llamar al repositorio.
- `authService.login` rechaza `username` vacio sin llamar al repositorio.
- `authService.adminLogin` exige password minimo de `10` caracteres.
- `authService.register` delega al repositorio con `username` normalizado.

### Auth Repository

Archivo:

`backend/src/modules/auth/auth.repository.test.ts`

Casos cubiertos:

- `loginWithRpc` llama a la RPC `user_login` con parametros correctos.
- `registerWithRpc` lanza un error claro cuando Supabase falla.
- `adminLoginWithRpc` usa la RPC `admin_login`.

### Auth Session

Archivo:

`backend/src/modules/auth/auth.session.test.ts`

Casos cubiertos:

- `setSessionCookie` guarda un token reutilizable desde la request.
- `readSessionUserIdFromRequest` devuelve `null` si no hay cookie o si el token es invalido.
- `readSessionRoleFromRequest` devuelve `null` si no hay cookie o si el token es invalido.
- Los helpers de sesion rechazan tokens con roles no soportados.
- `clearSessionCookie` limpia la cookie configurada.

### Auth Controller

Archivo:

`backend/src/modules/auth/auth.controller.test.ts`

Casos cubiertos:

- `login` devuelve `200` y setea cookie de vendedor cuando el login sale bien.
- `login` devuelve `401` cuando las credenciales son invalidas.
- `login` devuelve `500` cuando el servicio lanza una excepcion.
- `register` devuelve `201` cuando el registro sale bien.
- `register` devuelve `400` cuando falla una validacion.
- `adminLogin` devuelve `200` y setea cookie admin cuando sale bien.
- `session` devuelve sesion autenticada cuando la cookie es valida.
- `session` devuelve payload anonimo cuando no hay sesion valida.
- `logout` limpia la cookie de sesion.

## Frontend

### Parse Auth Response

Archivo:

`frontend/src/features/auth/api/parseAuthResponse.test.ts`

Casos cubiertos:

- Parsea correctamente un body JSON valido.
- Lanza error si la respuesta viene sin body.
- Lanza error si el body no es JSON valido.

## Scripts Para Ejecutarlos

Desde la raiz del proyecto:

```bash
npm run test
npm run test:coverage
```

## Cobertura Actual

Cobertura medida sobre lo implementado y configurado hasta ahora:

- Backend `auth`: `96.61%` lineas, `80.00%` ramas, `100.00%` funciones.
- Frontend `parseAuthResponse.ts`: `100%`.

## Alcance Actual

Estos tests cubren solo codigo real ya implementado. Todavia no incluyen:

- `RequireRoleRoute`
- `AuthSessionProvider`
- Formularios React de login y registro
- Paginas placeholder de vendedor/admin
- Modulos futuros de productos, resenas o moderacion
