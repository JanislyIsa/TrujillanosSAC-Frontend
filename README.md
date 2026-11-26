# Frontend de El Trujillano (tienda + intranet)

Un solo proyecto Angular 22 con dos áreas que comparten login y sesión (JWT):

| Área | Para quién | Rutas | Diseño |
|---|---|---|---|
| **Tienda** | Clientes | `/catalogo`, `/producto/:id`, `/carrito`, `/pedidos`, `/cuenta`, `/login`, `/registro`, `/recuperar-clave` | Guía de estilos de la tienda |
| **Intranet** | Empleados | `/intranet/inventario/...` (más módulos después, siempre bajo `/intranet/<modulo>`) | Diseño de inventario (barra lateral) |

Organización basada en [pharma-frontend](https://github.com/EstebanHub07/pharma-frontend). Backend: `PROYECTO-EL TRUJILLANO` (Spring Boot).

## Cómo funciona el acceso

- **Un solo login** (`/login`) con `POST /api/v1/auth/login`. El token JWT se guarda en `sessionStorage` y `authInterceptor` lo envía como `Authorization: Bearer` a toda la API. No hay cookies ni CSRF.
- Al ingresar, un **empleado** va a `/intranet` y un **cliente** a `/catalogo` (o a la pantalla que pidió, `?returnUrl=`).
- La respuesta del login trae `cargo`, `inventario` y `compras`: los módulos de la intranet a los que su cargo da acceso. `moduloGuard` los usa en cada ruta (`data: { modulos: [...] }`) y el menú lateral muestra solo lo permitido. **El backend vuelve a validar** cada petición (`@PreAuthorize`).
- Si el token vence (el backend responde 401) se cierra la sesión y se vuelve al login.
- Un cliente que escribe una ruta de `/intranet` vuelve al catálogo; un empleado sin permiso para un módulo ve «Acceso restringido».

## Estructura

```text
src/app
  core/        auth (AuthService, interceptor JWT, guards), utils, models;
               api.ts = InventarioApi (HTTP de los endpoints /inventario)
  layout/      main-layout + header (tienda)  ·  intranet-layout (barra lateral)
  shared/      componentes comunes (ticket, dialog, pager, icon, formato)
  features/
    auth/        login, registro, recuperar/restablecer contraseña, cuenta, sin-acceso
    ventas/      tienda: models, pages, services, utils, ventas.routes.ts
    inventario/  pages (páginas y sus formularios), inventario.routes.ts
src/environments   environment.ts (producción) · environment.development.ts
```

**Convención para módulos nuevos** (compras, ventas del jefe de ventas…): `features/<modulo>/{models,pages,services}` + `<modulo>.routes.ts`, y se cuelga en `app.routes.ts` dentro de `/intranet` con `moduloGuard`. Para agregar un módulo nuevo al enum de accesos hay que acordarlo con backend (`inventario` y `compras` salen hoy del cargo).

### Estilos: cada área carga los suyos

Las dos áreas usan clases con nombres parecidos (`.button`/`.boton`, `.notice`/`.alerta`) y estilos globales distintos. Por eso **no hay hoja global en `angular.json`**: `src/styles.css` (intranet) lo carga `IntranetLayout` y `estilos-tienda.css` (tienda) lo carga `MainLayout`, ambos con `ViewEncapsulation.None`. Angular los agrega al entrar al área y los quita al salir, así no se pisan. Si editas `styles.css`, solo afecta a la intranet.

## Desarrollo

Requiere Node compatible con Angular 22 (se verificó con Node 24) y el backend corriendo en `http://localhost:8080`.

```powershell
npm install
npm start          # http://localhost:4200  (ng serve, configuración development)
npm run build      # producción: environment.ts (apiUrl relativo /api/v1)
npm run check      # verifica TypeScript
```

- **Sin proxy.** En desarrollo `fileReplacements` cambia `environment.ts` por `environment.development.ts`: `apiUrl = http://localhost:8080/api/v1` y `backendUrl = http://localhost:8080` (las imágenes `/img/**` y `/uploads/**` las sirve Spring; se usan con `urlImagen()`).
- **CORS.** El backend permite el origen de `API_CORS_ORIGENES` (por defecto `http://localhost:4200`). Si cambias el puerto del frontend, agrégalo allí.
- **Pago con Culqi.** La llave pública (`pk_test_…`) está en el environment; la secreta vive solo en el backend.
- **Rutas normales** (sin `#`): el servidor que publique el build debe devolver `index.html` para cualquier ruta.

## Decisiones de funcionamiento

- El código de producto o insumo se asigna al guardar; no se predice un ID desde el navegador.
- Al editar, el saldo actual es de consulta. Los cambios de stock se registran mediante ingresos y salidas.
- Un registro existente conserva almacén y presentación/unidad para proteger su historial.
- Eliminar inactiva el registro; conserva cantidades e historial. Puede reactivarse desde Editar. Los productos inactivos no pueden venderse.
- Las solicitudes automáticas muestran las cantidades sugeridas antes de enviar, permitiendo revisarlas.
- Se impide el doble envío mientras se guarda; los errores conservan el formulario y sus valores.
- La carga inicial, los resultados vacíos, la falta de permisos y los errores del servidor tienen estados visibles.
- El diseño adapta el menú y los formularios a pantallas pequeñas. Las tablas conservan desplazamiento horizontal para mantener legibles los datos.

Contrato REST: `docs/inventario/openapi.json`. Las pruebas de backend se ejecutan con `./mvnw.cmd test`.
