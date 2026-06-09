# Plan de Tests Unitarios

Este documento define un plan de pruebas unitarias para los objetivos funcionales del proyecto. Esta pensado para que otras IAs o trabajadores puedan tomar cada bloque como una tarea concreta de implementacion y testing.

## Contexto del Proyecto

El repositorio esta organizado como monorepo con:

- `backend`: API Node.js + Express + TypeScript + Supabase RPC.
- `frontend`: React + TypeScript + Vite.
- `database`: scripts SQL usados como fuente de verdad para tablas, funciones y permisos.

Actualmente el proyecto tiene autenticacion de vendedores, login admin en frontend, rutas protegidas por rol y placeholders para areas de vendedor/admin. Todavia no existe una suite real de tests unitarios; el backend tiene un script placeholder.

## Preparacion Recomendada

Antes de implementar los tests por objetivo, preparar la infraestructura base.

### Backend

Herramienta recomendada:

- `Vitest`

Alcance:

- Servicios.
- Repositorios con mocks de Supabase RPC.
- Controladores con mocks de `Request` y `Response`.
- Validaciones de reglas de negocio.

Estructura sugerida:

```text
backend/src/modules/<module>/__tests__/*.spec.ts
```

Reglas:

- No usar una base de datos real en unitarios.
- Mockear `supabase.rpc`.
- Mockear servicios al probar controladores.
- Probar respuestas de error y exito.

### Frontend

Herramientas recomendadas:

- `Vitest`
- `React Testing Library`
- `@testing-library/user-event`
- `jsdom`

Alcance:

- Componentes.
- Formularios.
- Rutas protegidas.
- Estados de carga, exito, error y permisos.

Estructura sugerida:

```text
frontend/src/features/<feature>/__tests__/*.spec.tsx
frontend/src/app/guards/__tests__/*.spec.tsx
```

Reglas:

- Mockear llamadas HTTP.
- Mockear contexto de sesion cuando se prueben rutas protegidas.
- Probar lo que el usuario ve y hace, no detalles internos del componente.

### Database

Los scripts SQL se pueden verificar con tests de integracion, pero no deben considerarse tests unitarios puros. Para unitarios, la logica de acceso a datos debe probarse desde repositorios usando mocks.

## Objetivo 1: Resenas Anonimas

Historia:

> Como cliente quiero poder dejar resenas anonimas para mejorar la experiencia de otros usuarios sin exponer mi identidad.

### Backend

Modulo sugerido:

```text
backend/src/modules/reviews/
```

Archivos sugeridos:

```text
review.service.ts
review.repository.ts
review.controller.ts
review.types.ts
```

Tests sugeridos:

```text
review.service.spec.ts
review.controller.spec.ts
review.repository.spec.ts
```

Casos de prueba para `review.service.spec.ts`:

- Permite crear una resena con `product_id`, `rating` y `comment`.
- Marca la resena como anonima por defecto.
- Rechaza rating menor a `1`.
- Rechaza rating mayor a `5`.
- Rechaza comentario vacio.
- Rechaza comentario demasiado largo si existe limite definido.
- No acepta ni propaga `username`, `email`, `user_id` o datos personales visibles.
- Normaliza espacios innecesarios en comentarios si la regla se implementa.

Casos de prueba para `review.controller.spec.ts`:

- Devuelve `201` cuando la resena se crea correctamente.
- Devuelve `400` cuando faltan campos obligatorios.
- Devuelve `400` cuando la calificacion es invalida.
- Devuelve `500` si el servicio lanza un error inesperado.
- Nunca devuelve identidad del cliente en el JSON de respuesta.

Casos de prueba para `review.repository.spec.ts`:

- Llama a la RPC o funcion correspondiente con los parametros correctos.
- No envia campos de identidad del cliente a Supabase.
- Convierte errores de Supabase en errores manejables.

### Frontend

Componentes sugeridos:

```text
ReviewForm.tsx
ProductReviews.tsx
```

Tests sugeridos:

```text
ReviewForm.spec.tsx
ProductReviews.spec.tsx
```

Casos de prueba:

- El formulario muestra campos para comentario y calificacion.
- El formulario no muestra campos de nombre, correo o usuario.
- Permite enviar una resena valida.
- Muestra error si el rating es invalido.
- Muestra error si el comentario esta vacio.
- Deshabilita o bloquea el envio mientras se procesa.
- Al crear una resena, la lista la muestra como anonima.

### Criterios de Aceptacion

- El cliente puede enviar una resena sin identificarse publicamente.
- La respuesta publica no contiene datos personales.
- Las validaciones protegen calificacion y comentario.
- La UI no pide datos de identidad.

## Objetivo 2: Contacto Directo con Vendedores

Historia:

> Como empresa quiero que los clientes contacten con los vendedores directamente mediante sus enlaces o numeros telefonicos, para evitar manejar datos de pasarela de pagos.

### Backend

Modulo sugerido:

```text
backend/src/modules/vendors/
```

Tests sugeridos:

```text
vendor-contact.service.spec.ts
vendor-contact.controller.spec.ts
vendor-contact.repository.spec.ts
```

Casos de prueba para `vendor-contact.service.spec.ts`:

- Acepta telefono valido.
- Acepta URL valida de contacto.
- Acepta enlaces como WhatsApp, Instagram o sitio web externo si estan permitidos.
- Rechaza URL invalida.
- Rechaza telefono vacio cuando no existe otro medio de contacto.
- Rechaza formatos imposibles de telefono.
- No permite guardar datos de pasarela de pago.
- No permite guardar campos como `card_number`, `payment_token`, `checkout_url`, `cvv` o similares.

Casos de prueba para `vendor-contact.controller.spec.ts`:

- Devuelve `200` o `201` al guardar contacto valido.
- Devuelve `400` al recibir contacto invalido.
- Devuelve `403` si un vendedor intenta modificar contacto de otro vendedor.
- Devuelve `500` ante error inesperado del servicio.

Casos de prueba para `vendor-contact.repository.spec.ts`:

- Envia a Supabase solo campos permitidos de contacto.
- No envia datos de pago.
- Maneja errores de RPC o base de datos.

### Frontend

Componentes sugeridos:

```text
VendorContactLinks.tsx
VendorContactForm.tsx
ProductContactButton.tsx
```

Tests sugeridos:

```text
VendorContactLinks.spec.tsx
VendorContactForm.spec.tsx
ProductContactButton.spec.tsx
```

Casos de prueba:

- Muestra enlace telefonico con esquema `tel:` si hay numero.
- Muestra enlace externo si hay URL.
- Usa `target="_blank"` y `rel="noreferrer"` para enlaces externos.
- No muestra botones de pago, checkout o tarjeta.
- El formulario de vendedor permite editar telefono o enlace.
- El formulario muestra errores para telefono o URL invalidos.

### Criterios de Aceptacion

- Los clientes pueden contactar directamente al vendedor.
- El sistema no almacena ni muestra datos de pasarela de pagos.
- Los enlaces y telefonos se validan antes de guardarse.
- La UI prioriza contacto directo.

## Objetivo 3: Perfil Propio del Vendedor

Historia:

> Como vendedor quiero poder mostrar mis productos en mi propio apartado / perfil para que me diferencien de otros.

### Backend

Modulo sugerido:

```text
backend/src/modules/vendors/
backend/src/modules/products/
```

Tests sugeridos:

```text
vendor-profile.service.spec.ts
product.service.spec.ts
vendor-profile.controller.spec.ts
product.controller.spec.ts
```

Casos de prueba para `vendor-profile.service.spec.ts`:

- Obtiene el perfil publico de un vendedor.
- Devuelve nombre visible, descripcion, contacto y productos.
- No devuelve datos internos como password, logs o campos administrativos.
- No mezcla productos de otros vendedores.
- Devuelve estado vacio si el vendedor no tiene productos.
- Devuelve error o resultado controlado si el vendedor no existe.

Casos de prueba para `product.service.spec.ts`:

- Crea producto asociado al vendedor autenticado.
- Rechaza producto sin nombre.
- Rechaza producto sin vendedor propietario.
- Rechaza precio invalido si existe precio.
- Permite actualizar solo productos propios.
- Impide que un vendedor edite productos de otro vendedor.
- Permite ocultar o eliminar producto propio segun la regla definida.

Casos de prueba para controladores:

- Devuelven `200` al obtener perfil.
- Devuelven `201` al crear producto.
- Devuelven `400` con datos invalidos.
- Devuelven `403` cuando el vendedor no es propietario.
- Devuelven `404` cuando perfil o producto no existe.

### Frontend

Paginas/componentes sugeridos:

```text
VendorProfilePage.tsx
VendorProductList.tsx
VendorProductCard.tsx
VendorProductForm.tsx
```

Tests sugeridos:

```text
VendorProfilePage.spec.tsx
VendorProductList.spec.tsx
VendorProductForm.spec.tsx
```

Casos de prueba:

- La pagina muestra informacion publica del vendedor.
- Lista solo productos del vendedor correspondiente.
- Muestra mensaje de estado vacio si no hay productos.
- Muestra tarjetas de producto con nombre, descripcion e imagen si existe.
- Permite crear producto desde el area autenticada del vendedor.
- Muestra error si el producto tiene datos invalidos.
- No muestra controles de edicion en vista publica si no corresponde.

### Criterios de Aceptacion

- Cada vendedor tiene un apartado propio.
- Los productos se muestran separados por vendedor.
- La informacion publica no expone datos sensibles.
- El vendedor puede diferenciarse mediante perfil y productos.

## Objetivo 4: Manejo de Resenas por Empresa

Historia:

> Como empresa quiero manejar las resenas para poder eliminar las que no sean adecuadas.

### Backend

Modulo sugerido:

```text
backend/src/modules/admin/
backend/src/modules/reviews/
```

Tests sugeridos:

```text
admin-review.service.spec.ts
admin-review.controller.spec.ts
admin-review.repository.spec.ts
```

Casos de prueba para `admin-review.service.spec.ts`:

- Permite ocultar o eliminar resena si el rol es `admin`.
- Rechaza la accion si el rol es `vendor`.
- Rechaza la accion si no existe sesion.
- Rechaza la accion si la resena no existe.
- Registra razon de moderacion si la regla lo exige.
- No elimina productos asociados.
- No elimina vendedores asociados.
- Cambia estado de resena a `hidden`, `deleted` o equivalente segun el diseno.

Casos de prueba para `admin-review.controller.spec.ts`:

- Devuelve `200` al moderar correctamente.
- Devuelve `403` si el usuario no es admin.
- Devuelve `404` si la resena no existe.
- Devuelve `400` si faltan datos requeridos.
- Devuelve `500` si ocurre error inesperado.

Casos de prueba para `admin-review.repository.spec.ts`:

- Llama a RPC o metodo de persistencia con `review_id` y razon.
- No altera productos ni vendedores.
- Maneja errores de Supabase.

### Frontend

Paginas/componentes sugeridos:

```text
AdminReviewsPage.tsx
AdminReviewList.tsx
AdminReviewActions.tsx
ConfirmModerationDialog.tsx
```

Tests sugeridos:

```text
AdminReviewsPage.spec.tsx
AdminReviewList.spec.tsx
AdminReviewActions.spec.tsx
```

Casos de prueba:

- Lista resenas visibles o pendientes.
- Muestra comentario, calificacion, producto y estado de la resena.
- Permite ocultar o eliminar resena.
- Solicita confirmacion antes de eliminar.
- Muestra mensaje de exito al completar la accion.
- Muestra mensaje de error si falla la moderacion.
- No muestra acciones admin a vendedores.

### Criterios de Aceptacion

- Solo la empresa/admin puede moderar resenas.
- Las resenas inadecuadas pueden ocultarse o eliminarse.
- La moderacion no afecta productos ni vendedores.
- La UI admin permite manejar resenas de forma clara.

## Objetivo 5: Manejo Intuitivo del Apartado del Vendedor

Historia:

> Como vendedor quiero manejar mi apartado de manera intuitiva solo con ingresar a mi cuenta para que se me haga mas facil vender mis productos.

### Backend

Modulos sugeridos:

```text
backend/src/modules/vendors/
backend/src/modules/products/
backend/src/modules/auth/
```

Tests sugeridos:

```text
vendor-area.service.spec.ts
vendor-area.controller.spec.ts
product-management.service.spec.ts
```

Casos de prueba para `vendor-area.service.spec.ts`:

- Carga el apartado usando el vendedor autenticado.
- No requiere ingresar manualmente `user_id`.
- Rechaza acceso si no hay sesion.
- Rechaza acceso si el rol no es `vendor`.
- No permite editar apartado de otro vendedor.
- Permite actualizar descripcion, contacto e informacion publica propia.

Casos de prueba para `product-management.service.spec.ts`:

- Permite crear producto propio.
- Permite editar producto propio.
- Permite eliminar u ocultar producto propio.
- Rechaza editar producto de otro vendedor.
- Valida campos obligatorios del producto.
- Devuelve errores claros para datos invalidos.

Casos de prueba para controladores:

- Devuelven `200` al cargar el area del vendedor.
- Devuelven `401` si no hay sesion.
- Devuelven `403` si el rol no es vendedor.
- Devuelven `400` con datos invalidos.
- Devuelven `404` si el producto no existe.

### Frontend

Ya existe una ruta protegida base en:

```text
frontend/src/app/guards/RequireRoleRoute.tsx
```

Tests sugeridos:

```text
RequireRoleRoute.spec.tsx
VendorAreaPage.spec.tsx
VendorProfileEditor.spec.tsx
VendorProductManager.spec.tsx
```

Casos de prueba para `RequireRoleRoute.spec.tsx`:

- Si la sesion esta cargando, muestra estado de carga.
- Si no hay sesion, redirige a `/auth/login` para rutas de vendedor.
- Si el rol es `vendor`, permite entrar a `/vendor`.
- Si el rol es incorrecto, redirige a `/profile`.
- Si la ruta requiere admin, redirige anonimos a `/auth/lg-admin`.

Casos de prueba para el area del vendedor:

- El vendedor ve su apartado al iniciar sesion.
- La pantalla carga datos propios automaticamente.
- Puede editar informacion publica.
- Puede crear productos.
- Puede editar productos.
- Puede eliminar u ocultar productos.
- Muestra estados de carga.
- Muestra mensajes de exito.
- Muestra mensajes de error.
- No muestra campos tecnicos como `user_id` para que el vendedor los edite manualmente.

### Criterios de Aceptacion

- El vendedor puede manejar su apartado despues de iniciar sesion.
- El sistema identifica al vendedor por la sesion, no por entrada manual.
- El vendedor solo administra sus propios datos.
- La UI es directa, clara y sin pasos innecesarios.

## Tests Existentes o Cercanos a Implementar Primero

Antes de agregar todos los modulos nuevos, conviene cubrir lo ya existente.

### Backend Auth

Archivos actuales relevantes:

```text
backend/src/modules/auth/auth.service.ts
backend/src/modules/auth/auth.repository.ts
backend/src/modules/auth/auth.controller.ts
backend/src/modules/auth/auth.session.ts
```

Tests recomendados:

```text
auth.service.spec.ts
auth.controller.spec.ts
auth.repository.spec.ts
auth.session.spec.ts
```

Casos clave:

- Login vendedor valida username requerido.
- Login vendedor valida password minimo 6 caracteres.
- Login vendedor normaliza username con `trim`.
- Login admin valida password minimo 10 caracteres.
- Registro vendedor valida username y password.
- Controller login devuelve `401` si credenciales son invalidas.
- Controller login setea cookie si login es correcto.
- Controller logout limpia cookie.
- Session devuelve `authenticated: false` sin cookie.
- Session devuelve `authenticated: true` con cookie valida.

### Frontend Auth y Rutas

Archivos actuales relevantes:

```text
frontend/src/app/guards/RequireRoleRoute.tsx
frontend/src/features/auth/api/parseAuthResponse.ts
frontend/src/features/auth/session/AuthSessionProvider.tsx
frontend/src/features/auth/components/VendorLoginForm.tsx
frontend/src/features/auth/components/VendorRegisterForm.tsx
```

Tests recomendados:

```text
RequireRoleRoute.spec.tsx
parseAuthResponse.spec.ts
VendorLoginForm.spec.tsx
VendorRegisterForm.spec.tsx
AuthSessionProvider.spec.tsx
```

Casos clave:

- `parseAuthResponse` parsea JSON valido.
- `parseAuthResponse` lanza error si el body esta vacio.
- `parseAuthResponse` lanza error si el JSON es invalido.
- Login form envia username y password.
- Login form muestra errores del backend.
- Register form envia username y password.
- Rutas protegidas respetan rol `vendor` y `admin`.

## Cobertura de Codigo

Ademas de ejecutar tests unitarios, el proyecto debe medir cobertura de codigo. La suite debe fallar si la cobertura global baja de `80%`.

### Herramienta Recomendada

Usar cobertura integrada de `Vitest` con provider `v8`.

Dependencias sugeridas:

```text
vitest
@vitest/coverage-v8
```

Para frontend agregar tambien:

```text
@testing-library/react
@testing-library/user-event
@testing-library/jest-dom
jsdom
```

### Scripts Recomendados

En `backend/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

En `frontend/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

En `package.json` de la raiz:

```json
{
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "test:coverage": "npm run test:coverage --workspaces --if-present"
  }
}
```

### Configuracion de Cobertura

Cada workspace debe tener configuracion de Vitest. Se puede usar `vitest.config.ts` o extender la configuracion existente de Vite en frontend.

Configuracion base sugerida para backend:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      exclude: [
        'dist/**',
        'coverage/**',
        'src/server.ts',
        '**/*.d.ts',
        '**/*.types.ts'
      ]
    }
  }
})
```

Configuracion base sugerida para frontend:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      exclude: [
        'dist/**',
        'coverage/**',
        'src/main.tsx',
        '**/*.d.ts',
        '**/*.types.ts',
        '**/*.config.ts'
      ]
    }
  }
})
```

Archivo sugerido para frontend:

```text
frontend/src/test/setup.ts
```

Contenido sugerido:

```ts
import '@testing-library/jest-dom/vitest'
```

### Comando de Verificacion

Para comprobar tests y cobertura desde la raiz:

```bash
npm run test:coverage
```

La ejecucion debe:

- Correr tests unitarios de backend.
- Correr tests unitarios de frontend.
- Generar reporte de cobertura en cada workspace.
- Fallar automaticamente si lineas, funciones, ramas o statements bajan de `80%`.

### Reportes Esperados

Reportes locales por workspace:

```text
backend/coverage/index.html
frontend/coverage/index.html
```

Estos reportes permiten revisar que archivos tienen poca cobertura y que lineas faltan probar.

### Regla de Aprobacion

Un objetivo no se considera terminado si:

- Sus tests pasan pero la cobertura global queda por debajo de `80%`.
- Solo sube cobertura probando archivos triviales y deja sin probar reglas de negocio.
- Excluye archivos importantes para subir el porcentaje artificialmente.
- No incluye tests de errores, permisos y casos limite.

La meta minima es `80%`, pero los modulos criticos deberian aspirar a mayor cobertura:

- Auth y sesiones: `90%` recomendado.
- Permisos por rol: `90%` recomendado.
- Resenas anonimas: `85%` recomendado.
- Moderacion admin: `85%` recomendado.
- Productos y perfil vendedor: `80%` minimo.

## Orden de Trabajo Recomendado

1. Instalar y configurar herramientas de test.
2. Configurar cobertura con umbral minimo de `80%`.
3. Agregar script global `npm run test:coverage`.
4. Crear tests base para auth backend.
5. Crear tests base para auth frontend y rutas protegidas.
6. Implementar modulo de perfil vendedor con tests.
7. Implementar modulo de productos con tests.
8. Implementar contacto directo con tests.
9. Implementar resenas anonimas con tests.
10. Implementar moderacion admin de resenas con tests.
11. Verificar que toda la suite pase con `npm run test:coverage`.

## Definicion General de Terminado

Cada objetivo se considera cubierto cuando:

- Tiene tests unitarios de validacion de datos.
- Tiene tests unitarios de permisos y roles.
- Tiene tests unitarios de respuestas correctas en backend.
- Tiene tests unitarios de estados principales en frontend.
- Tiene al menos un test que protege contra exposicion de datos sensibles cuando aplique.
- Los tests pueden ejecutarse desde la raiz con `npm run test`.
- La cobertura puede ejecutarse desde la raiz con `npm run test:coverage`.
- La cobertura global cumple minimo `80%` en lineas, funciones, ramas y statements.
- Los reportes de cobertura se generan correctamente para backend y frontend.

## Reglas Para IAs Trabajadoras

- No implementar tests contra una base real para unitarios.
- No mezclar refactors grandes con la implementacion de tests.
- Mantener los nombres de tests claros y ligados a la historia de usuario.
- Si se crea un modulo nuevo, incluir service, repository, controller y types cuando aplique.
- Mockear dependencias externas como Supabase, fetch y contexto de sesion.
- Priorizar pruebas de reglas de negocio sobre pruebas de detalles visuales.
- Mantener cobertura minima de `80%`.
- No excluir archivos importantes solo para subir el porcentaje de cobertura.
- No eliminar ni revertir cambios existentes sin confirmacion.
- Mantener cada objetivo en commits o cambios separados cuando sea posible.
