# Guía de Arquitectura — Inquieta Dulzura

> **Disclaimer:** Este documento fue generado el 2026-07-06 (última actualización: 2026-07-19) como guía de referencia del sistema.
> No es una especificación vinculante; la fuente de verdad es el código fuente y el schema de la base de datos.
> Si encontrás una discrepancia entre esta guía y el código, **el código tiene la razón**.
> Esta guía puede quedar obsoleta si el sistema evoluciona sin actualizarla.

---

## Índice

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Arquitectura del Servidor (API REST)](#3-arquitectura-del-servidor-api-rest)
4. [Bot de Telegram](#4-bot-de-telegram)
5. [Cliente Web (React)](#5-cliente-web-react)
6. [Base de Datos MySQL](#6-base-de-datos-mysql)
7. [Autenticación JWT](#7-autenticación-jwt)
8. [Gestión de Fotos](#8-gestión-de-fotos)
9. [Integración con Instagram API](#9-integración-con-instagram-api)
10. [Reglas de Negocio](#10-reglas-de-negocio)
11. [Guía de Uso del Bot de Telegram](#11-guía-de-uso-del-bot-de-telegram)
12. [Buenas Prácticas y Convenciones](#12-buenas-prácticas-y-convenciones)
13. [Comandos de Desarrollo Útiles](#13-comandos-de-desarrollo-útiles)

---

## 1. Stack Tecnológico

### Backend (Server)
| Tecnología | Versión | Propósito |
|---|---|---|
| **Node.js** | ≥ 18 | Runtime |
| **TypeScript** | ~5.3 | Tipado estático |
| **Express** | ~4.17 | Framework HTTP (API REST) |
| **MySQL2** | ~3.15 | Driver MySQL con pool de conexiones |
| **grammy** | ~1.44 | Framework de Bot de Telegram |
| **JWT (jsonwebtoken)** | ~9.0 | Autenticación stateless |
| **bcrypt** | ~5.1 | Hashing de contraseñas |
| **Cloudinary SDK** | ~2.8 | Almacenamiento cloud de fotos |
| **multer** | ~1.4 | Upload de archivos multipart |
| **Zod** | ~4.4 | Validación de schemas |
| **dotenv** | ~16 | Variables de entorno |
| **axios** | ~1.6 | HTTP client (Graph API de Instagram, también usado en client) |
| **Mercado Pago SDK** | ~2.3 | Integración de pagos (preference creation, webhook IPN) |

### Frontend (Client)
| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | ~18.3 | UI |
| **Vite** | ~7.2 | Bundler / dev server |
| **Tailwind CSS v4** | ~4.3 | Estilos utility-first |
| **shadcn/ui** | ~4.12 | Componentes UI reutilizables (Radix + Tailwind) |
| **Lucide React** | ~1.23 | Iconos SVG |
| **Axios** | ~1.6 | HTTP client con interceptor de refresh |
| **React Router** | ~6.3 | Ruteo SPA |
| **Zod** | ~4.4 | Validación client-side |
| **sonner** | ~2.0 | Toast notifications |
| **class-variance-authority** | ~0.7 | Variantes de componentes |
| **tailwind-merge** | ~3.6 | Fusión de clases Tailwind |
| **Geist Font** | ~5.2 | Tipografía variable |

### Testing
| Tecnología | Propósito |
|---|---|
| **Vitest** | Test runner unificado (server y client) |
| **jsdom** | DOM simulator para tests client |
| **@testing-library/react** | Tests de componentes React |

---

## 2. Estructura del Proyecto

```
inquieta-dulzura/
├── client/                          # Frontend React + Vite
│   ├── src/
│   │   ├── components/ui/           # shadcn/ui components (button, card, table, etc.)
│   │   ├── components/              # Componentes de página (Login, Dashboard, Navbar, etc.)
│   │   │   ├── InstagramCaptionEditor.tsx   # Diálogo caption + upload
│   │   │   ├── InstagramPublishButton.tsx   # Botón de publicación
│   │   │   ├── InstagramMetricsCard.tsx     # Métricas con selector de período
│   │   │   ├── InstagramCommentManager.tsx  # Comentarios con reply/hide
│   │   │   └── InstagramSettings.tsx        # Configuración admin
│   │   ├── ContenidoDigital.tsx     # Página de galería contenido digital
│   │   ├── ContenidoDigital.css     # Estilos de galería
│   │   ├── Clientes.tsx             # Página de gestión de clientes
│   │   ├── HistorialVentas.tsx      # Página de historial de ventas
│   │   ├── contexts/                # React Contexts (Auth, Notification, Confirm)
│   │   ├── services/api.ts          # Cliente Axios singleton
│   │   ├── schemas/                 # Schemas Zod client-side
│   │   │   ├── contenido-digital.schema.ts
│   │   │   └── cliente.schema.ts    # Validación de clientes
│   │   ├── types/                   # Interfaces TypeScript compartidas
│   │   │   ├── Cliente.ts           # Tipo de cliente
│   │   │   └── Venta.ts             # Tipo de venta
│   │   ├── lib/utils.ts             # Utilidades (cn() para Tailwind)
│   │   ├── lib/animations.ts        # Variantes de animación Framer Motion
│   │   └── __tests__/               # Tests Vitest client
│   │       └── ContenidoDigital.test.tsx
│   └── vite.config.ts               # Proxy /api → localhost:3000
│
├── server/                          # Backend Express + Bot
│   ├── src/
│   │   ├── index.ts                 # Entry point: Express + webhook mounting + VITEST guard
│   │   ├── loadEnv.ts               # Carga .env desde la raíz
│   │   ├── db.ts                    # Re-export del pool
│   │   ├── config/
│   │   │   ├── database.ts          # Pool de conexiones MySQL
│   │   │   ├── cloudinary.ts        # Configuración Cloudinary
│   │   │   ├── instagram.ts         # Configuración Instagram (token, appId, etc.)
│   │   │   └── migrations/          # Migraciones SQL programáticas
│   │   │       └── 002_create_contenido_digital.sql  # Tabla contenido_digital
│   │   │   └── 003_backup_and_remove_stock_trigger.sql  # Eliminación trigger stock
│   │   ├── models/                  # Interfaces de datos (Usuario.ts)
│   │   ├── dtos/                    # DTOs por entidad (ContenidoDigitalDTO.ts, etc.)
│   │   ├── types/                   # Tipos compartidos (express.ts)
│   │   ├── middleware/              # auth, validate (Zod), duplicateError
│   │   ├── schemas/                 # Schemas Zod para validación
│   │   ├── controllers/             # Handlers HTTP (sin lógica de negocio)
│   │   │   ├── InstagramController.ts      # 9 endpoints de Instagram (métricas, comentarios, publish)
│   │   │   ├── ContenidoDigitalController.ts # CRUD contenido digital + router embebido
│   │   │   └── VentasController.ts         # Controlador de ventas
│   │   ├── services/                # Lógica de negocio + queries SQL
│   │   │   ├── InstagramService.ts         # Cliente Graph API: token, media, métricas, comentarios
│   │   │   ├── ContenidoDigitalService.ts  # CRUD + etiquetas en contenido_digital (MySQL)
│   │   │   ├── PagosService.ts             # Integración Mercado Pago (preferencia, webhook)
│   │   │   └── VentasService.ts            # Lógica de ventas + stock
│   │   ├── routes/                  # Definición de rutas Express
│   │   │   ├── instagram.ts         # 9 rutas Instagram (montaje condicional)
│   │   │   ├── ventas.ts            # Rutas de ventas
│   │   │   └── mercado-pago.ts      # Rutas Mercado Pago (preferencia, webhook)
│   │   ├── types/
│   │   │   └── instagram.ts         # Interfaces InstagramToken, InstagramMetrics, InstagramComment
│   │   ├── bot/                     # Bot de Telegram
│   │   │   ├── index.ts             # setupBot() + configureWebhook()
│   │   │   ├── auth.ts              # authGuard por whitelist
│   │   │   ├── parser.ts            # Parser de comandos con regex
│   │   │   ├── polling.ts           # Entry point para modo polling
│   │   │   ├── handlers/            # Handlers por entidad
│   │   │   └── types.ts             # Tipos del parser
│   │   └── __tests__/               # Tests Vitest
│   │       ├── bot/                 # Tests del bot
│   │       └── *.test.ts            # Tests de services
│   └── uploads/                     # Archivos subidos (fotos)
│
├── migrations/                      # Migraciones SQL legacy
│   └── create_instagram_posts.sql   # Tabla para posts publicados en Instagram
├── server/src/config/migrations/    # Migraciones SQL programáticas (ejecutadas por setup)
│   └── 002_create_contenido_digital.sql  # Tabla contenido_digital con etiquetas JSON
├── schema_corregido.sql             # Schema completo + datos de ejemplo
├── vitest.config.ts                 # Configuración Vitest (proyectos server + client)
├── .env.example                     # Template de variables de entorno
└── package.json                     # Scripts root
```

---

## 3. Arquitectura del Servidor (API REST)

La API sigue una arquitectura en **3 capas**:

```
Ruta (Router)
  → Controller (solo recibe req/res, delega lógica)
    → Service (lógica de negocio + queries SQL)
      → MySQL (via pool de conexiones)
```

### Flujo de una petición típica

```
Cliente → Express → CORS → JSON parser → [Auth Middleware] → [Validate Middleware] → Router
  → Controller → Service → MySQL → Service → Controller → Response JSON
```

### Convenciones de respuesta

- **Éxito GET**: `200` con el/los objetos directamente en el body
- **Éxito POST**: `201` con el objeto creado
- **Éxito PUT**: `200` con el objeto actualizado
- **Éxito DELETE**: `204` sin body
- **Error**: `{ success: false, error: string, details?: [...] }` con status 400/401/403/404/409/500
- **Error de validación (Zod)**: `400` con `{ success: false, error: "Validation failed", details: [{ field, message }] }`

### Duplicados

El middleware `handleDuplicateError` captura errores `ER_DUP_ENTRY` (MySQL errno 1062) y responde `409` con un mensaje amigable. Usado en controllers de Categoría, Producto e Ingrediente.

### Conexión a MySQL

- Pool de conexiones en `server/src/config/database.ts`
- Configurable vía `.env`: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- Connection limit: 10, keep-alive habilitado
- Servicios fueron migrados progresivamente de `db.ts` (import directo) a `pool` desde `config/database.ts`

### Arranque condicional (VITEST)

Al final de `index.ts`:

```typescript
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
if (!isTestEnv) {
  void startServer();
}
```

Cuando `VITEST=true` (entorno de tests), el servidor **no arranca** — solo se exportan los módulos para que Vitest pueda importarlos sin levantar un proceso HTTP real. Esto evita conflictos de puerto en los tests.

### Middleware de autenticación

| Middleware | Uso |
|---|---|
| `authenticateToken` | Requiere JWT válido. Falla con 401 si no hay token, 403 si es inválido/expirado |
| `optionalAuth` | No falla si no hay token; si hay, intenta decodificar y agrega `req.user` |
| `requireAdmin` | Requiere que `req.user.rol === 'admin'` (se usa después de authenticateToken) |

### Validación con Zod

El middleware `validate(schema, source)` recibe un schema Zod y una fuente (`body`, `params`, `query`).
Usa `safeParse`, y si falla, responde `400` con la lista de errores detallados.
El body/params/query se reemplazan con los datos parseados (coerción, trim, etc.).

### Contenido Digital

`ContenidoDigitalController` es un caso particular: **contiene el router embebido** en lugar de usar un archivo separado en `routes/`. Se monta en `/api/contenido-digital` sin autenticación (público).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/contenido-digital` | Lista todo el contenido digital |
| `GET` | `/api/contenido-digital/:id` | Obtener por ID |
| `POST` | `/api/contenido-digital` | Crear nuevo contenido |
| `PUT` | `/api/contenido-digital/:id` | Actualizar (partial update) |
| `DELETE` | `/api/contenido-digital/:id` | Eliminar |

El `ContenidoDigitalService` implementa:
- **Partial update dinámico** (SET condicional igual que `IngredienteService.update()`)
- **Etiquetas como JSON array** en MySQL, con búsqueda via `JSON_SEARCH`
- **Métodos específicos**: `agregarEtiqueta()`, `eliminarEtiqueta()`, `obtenerImagenesPorEtiqueta()`, `obtenerImagenesPorProducto()`
- Mapeo DTO ↔ DB row via helper `rowToDTO()` (snake_case ↔ camelCase)

### Mercado Pago

`MercadoPagoService` maneja la integración con la API de Mercado Pago:

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/mercado-pago/preferencia` | Private | Crear preferencia de pago MP |
| `POST` | `/api/mercado-pago/webhook` | Public (IPN) | Recibir notificaciones de pago |
| `PATCH` | `/api/ventas/:id/status` | Admin | Actualizar estado de venta manualmente |

**Flujo de pago MP:**
1. Frontend crea preferencia → redirige a `init_point` (checkout MP)
2. Usuario paga → MP envía webhook IPN a `/api/mercado-pago/webhook`
3. Webhook verifica firma HMAC-SHA256, actualiza pago y venta
4. Si `approved`: venta → `completada`, stock se decrementa
5. Si `rejected`: venta → `cancelada`, stock se preserva
6. Si `pending`: venta se mantiene en `pendiente`

**Rate limiting:** El endpoint webhook tiene rate limiter in-memory (30 req/min por IP).

**Idempotency:** El webhook verifica `referencia_externa` antes de procesar — duplicados se ignoran.

**Stock:** El trigger `after_venta_detalle_insert` fue eliminado (migración 003). El stock ahora se maneja en el service:
- MP: stock se reserva al crear venta (SELECT FOR UPDATE), se decrementa solo al aprobar webhook
- Otros métodos: stock se decrementa inmediatamente al crear venta

---

## 4. Bot de Telegram

### Arquitectura del Bot

```
grammy (Bot framework)
├── authGuard (middleware global — whitelist de chat IDs)
├── bot.command('start', startCommand)
├── bot.command('ayuda', ayudaCommand)
├── bot.command('categorias' | 'productos' | 'ingredientes' | 'stock' | 'venta')
├── bot.hears(/^\/.../) → handlers específicos
├── bot.on('message:photo', fotoHandler)
└── bot.on('message', ...) → catch-all (ignora silenciosamente)
```

### Modos de ejecución

El bot soporta **dos modos** mutuamente excluyentes:

1. **Webhook** (producción): montado en Express como middleware en `POST /api/bot/webhook`
2. **Polling** (desarrollo): proceso independiente `server/src/bot/polling.ts`

Controlado por `BOT_POLLING=true/false` en `.env`.

### Whitelist de acceso

`BOT_CHAT_IDS` es una lista separada por comas de IDs de Telegram que pueden usar el bot.
El middleware `authGuard` rechaza silenciosamente mensajes de IDs no autorizados (no responde, no loggea nada — el atacante no sabe que existe un bot).

### Patrón de handlers

Cada entidad (categorías, productos, ingredientes, stock, ventas) sigue el mismo patrón:

1. **Parser** (`parser.ts`): extrae parámetros del texto con regex, devuelve `ParseResult<T>` con `success` y `data` o `error`
2. **Handler** (`handlers/`): recibe `Context` de grammy, llama al parser, llama al Service, responde con `ctx.reply()`
3. **Service** (reutilizado de la API REST): contiene la lógica de negocio

### Parser

El parser devuelve `ParseResult<T>`:

```typescript
type ParseResult<T> = { success: true; data: T } | { success: false; error: string };
```

Cada comando tiene su función de parseo específica con regex. Las unidades de medida de ingredientes se validan via regex con la constante `VALID_UNITS = '(kg|gramos|litros|ml|unidades)'`.

### Manejo de fotos

El bot acepta fotos: el usuario envía una foto con el **ID del producto como caption**.
El handler `fotoHandler` procesa la foto y la asocia al producto.

---

## 5. Cliente Web (React)

### Estructura de páginas

| Ruta | Componente | Requiere Auth |
|---|---|---|
| `/` | LandingPage | No |
| `/catalogo` | Catalogo (público) | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/dashboard` | Dashboard | Sí |
| `/inventario` | Inventario | Sí |
| `/recetas` | Recetas | Sí |
| `/ventas` | Ventas | Sí |
| `/contenido-digital` | ContenidoDigital | Sí |
| `/categorias` | Categorias | Sí |
| `/ingredientes` | Ingredientes | Sí |
| `/clientes` | Clientes | Sí |
| `/historial-ventas` | HistorialVentas | Sí |

### Contextos globales

- **AuthContext**: maneja login/register/logout, almacena tokens en localStorage, refresca usuario, expone `user` e `isAuthenticated`
- **NotificationContext**: notificaciones tipo toast
- **ConfirmContext**: modal de confirmación reutilizable (Acción Peligrosa Confirmation)

### ApiService (singleton)

Cliente Axios con:
- Interceptor request: agrega `Authorization: Bearer <token>` desde localStorage
- Interceptor response: 
  - Si recibe 403 (token expirado), intenta refresh automático con el refreshToken
  - Mientras refresca, encola las peticiones pendientes y las re-ejecuta cuando obtiene el nuevo token
  - Si el refresh falla, borra tokens y redirige a `/login`
- Normaliza errores del server: si la respuesta tiene `{ success: false, error: string }`, agrega `message` para los handlers del componente

### UI Components (shadcn/ui)

Componentes base en `client/src/components/ui/`:
`button`, `card`, `input`, `label`, `select`, `table`, `dialog`, `alert-dialog`, `badge`, `sheet`

### Animaciones (Framer Motion)

Todas las páginas admin usan animaciones de entrada con Framer Motion via `client/src/lib/animations.ts`:

| Variante | Uso |
|---|---|
| `fadeUp` | Headers, cards individuales, filas de tabla |
| `fadeIn` | Estados vacíos, paneles de filtros |
| `fadeInFromLeft` | Secciones de detalle (dialog Recetas) |
| `staggerContainer` | Grids de cards, tbody de tablas |

Hook `useReducedMotion()` detecta preferencia del sistema y desactiva animaciones si `prefers-reduced-motion: reduce`.

Páginas animadas: Inventario, Recetas, Categorias, Ingredientes, ContenidoDigital, Clientes, HistorialVentas, Ventas, Dashboard.

### Estilos

- **Tailwind CSS v4**: utility-first, configurado vía `@tailwindcss/vite` plugin
- **tw-animate-css**: animaciones
- **clsx + tailwind-merge**: función `cn()` para combinar clases condicionalmente
- **Geist Variable** font vía `@fontsource-variable/geist`

---

## 6. Base de Datos MySQL

### Diagrama entidad-relación

```
categorias 1──N productos 1──N fotos_productos
                     1──1 stock
                     N──M recetas (via producto_receta)

recetas 1──N receta_ingrediente N──1 ingredientes

clientes 1──N ventas (cabecera)
ventas 1──N venta_detalle N──1 productos

contenido_digital N──1 productos (opcional)

usuarios (autenticación)
refresh_tokens (JWT refresh)
```

### Tablas principales

| Tabla | Propósito | Soft-delete |
|---|---|---|
| `categorias` | Categorías de productos | `activo` |
| `productos` | Catálogo de productos | `activo` |
| `ingredientes` | Catálogo de ingredientes | `activo` |
| `recetas` | Recetas de preparación | `activo` |
| `receta_ingrediente` | Relación M:N receta ↔ ingrediente | No |
| `producto_receta` | Relación M:N producto ↔ receta | No |
| `stock` | Inventario de productos | No (1:1 con producto) |
| `ventas` | Cabecera de venta | `estado` |
| `venta_detalle` | Líneas de venta | No |
| `clientes` | Clientes (opcional) | `activo` |
| `contenido_digital` | Contenido digital (imágenes/videos) con etiquetas JSON | No (delete cascade) |
| `fotos_productos` | Fotos asociadas a productos | No (delete cascade) |
| `fotos_eliminadas_log` | Log de fotos eliminadas | No |
| `instagram_posts` | Posts publicados en Instagram (pendiente de integrar) | No |
| `usuarios` | Usuarios del sistema | `activo` |
| `refresh_tokens` | Tokens JWT refresh | No |
| `pagos` | Pagos asociados a ventas | No |

### Triggers

1. ~~**`after_venta_detalle_insert`**: al insertar un detalle de venta, descuenta automáticamente del stock~~ → **ELIMINADO** (migración 003). El stock ahora se maneja en `VentasService`.
2. **`before_foto_delete`**: antes de borrar una foto, registra en `fotos_eliminadas_log`

### Vistas

1. **`v_productos_stock_bajo`**: productos con cantidad_disponible ≤ cantidad_minima
2. **`v_ventas_completas`**: ventas con detalle, producto, cliente
3. **`v_estadisticas_fotos`**: estadísticas de almacenamiento de fotos

### Datos de ejemplo

El schema incluye `INSERT` de ejemplo: 4 categorías, 6 ingredientes, 3 productos con stock.
Usa `ON DUPLICATE KEY UPDATE` e `INSERT IGNORE` para ser re-ejecutable (idempotente).

---

## 7. Autenticación JWT

### Flujo

```
Register/Login → AuthService genera:
  - accessToken (JWT, expira 15 min)
  - refreshToken (random hex de 64 bytes, expira 7 días, guardado en BD)
  
El cliente almacena ambos en localStorage.

Cada request incluye: Authorization: Bearer <accessToken>

Cuando el accessToken expira (respuesta 403):
  → ApiService llama POST /api/auth/refresh con el refreshToken
  → Obtiene nuevo accessToken
  → Reintenta la request original

Logout → DELETE del refreshToken en BD
```

### Payload JWT

```typescript
interface JWTPayload {
  userId: number;
  email: string;
  rol: 'admin' | 'usuario';
}
```

### Roles

- **admin**: acceso completo
- **usuario**: acceso a rutas protegidas, sin privilegios administrativos

---

## 8. Gestión de Fotos

### Almacenamiento dual

El sistema soporta **dos backends** de almacenamiento de fotos, elegidos automáticamente:

1. **Local** (desarrollo): archivos en `server/uploads/productos/`. Rutas en BD + servidor estático Express en `/uploads`
2. **Cloudinary** (producción): si las credenciales `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` están configuradas

La detección es automática en `cloudinary.ts` mediante `verificarConfiguracion()`.

### Funcionalidades del FotoService

- Subir foto (local o Cloudinary)
- Eliminar foto (limpia archivo físico + BD)
- Obtener fotos de un producto (ordenadas por principal → orden ASC)
- Establecer foto como principal (desmarca las demás)
- Reordenar fotos
- Estadísticas de almacenamiento
- Limpieza de archivos huérfanos (local solamente)

### Validaciones

- Formatos permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Tamaño máximo: 5MB
- El producto debe existir antes de subir una foto

### Tabla `fotos_productos`

Campos clave:
- `url_publica`: siempre poblada (local o Cloudinary)
- `cloudinary_public_id`: solo Cloudinary
- `ruta_relativa` / `ruta_completa`: solo local
- `es_principal` / `orden`: control de visualización

### Bot de Telegram

El handler `fotoHandler` permite subir fotos desde Telegram enviando una foto con el ID del producto como caption.
Procesa la imagen, la asocia al producto y responde con confirmación.

---

## 9. Integración con Instagram API

> **Requiere:** Cuenta de Instagram **Business** o **Creator**, una App de Meta for Developers, y una Fan Page de Facebook (puente técnico, sin contenido necesario).

### Stack adicional

| Tecnología | Propósito |
|---|---|
| **Meta Graph API v21.0** | API de Instagram Business para publicación, métricas y comentarios |
| **axios** | Cliente HTTP para llamadas a la Graph API |

### Variables de Entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `META_APP_ID` | Sí | ID de la app en Meta for Developers |
| `META_APP_SECRET` | Sí | Secret de la app |
| `INSTAGRAM_ACCESS_TOKEN` | Sí | Token de acceso de larga duración (60 días) |
| `INSTAGRAM_BUSINESS_ID` | Sí | ID de la cuenta de Instagram Business |

Si las 4 están presentes, el servidor monta automáticamente las rutas en `/api/instagram`. Si falta alguna, las rutas se desactivan silenciosamente y el server logea:
```
ℹ️  Instagram no configurado — rutas desactivadas
```

### Arquitectura del Servicio

`InstagramService` (`server/src/services/InstagramService.ts`) implementa el cliente de la Graph API de Meta siguiendo el patrón de 3 capas del proyecto:

```
Ruta → InstagramController → InstagramService → Graph API (Meta)
```

#### 9.1 Token Management

- `ensureValidToken()` — verifica expiración del token; si faltan < 7 días o expiración desconocida, refresca automáticamente
- `exchangeToken(shortLivedToken)` — canjea un token de 1 hora por uno de larga duración (60 días)
- `refreshToken()` — refresca el token actual vía `GET /oauth/access_token` de Meta

#### 9.2 Media & Publish

- `uploadMedia(imageUrl, caption)` — crea un container de media en Instagram, devuelve `containerId`
- `publishPost(containerId)` — publica el container, devuelve `instagramPostId`
- Validación server-side: caption ≤ 2200 caracteres (tira `ValidationError` si excede)

#### 9.3 Métricas

- `getMetrics(instagramPostId, period)` — devuelve `{ likeCount, commentCount, reach, impressions, timestamp }`
- Cache en memoria (Map) con TTL de 15 minutos, clave `${postId}:${period}`
- Periodos disponibles: `7d` (7 días), `30d` (30 días), `all` (sin filtro)
- El filtro por período se hace server-side comparando el `timestamp` del post

#### 9.4 Comentarios

- `getComments(postId)` — lista comentarios con `id`, `text`, `username`, `timestamp`
- `replyToComment(commentId, text)` — responde a un comentario
- `hideComment(commentId)` / `unhideComment(commentId)` — oculta/muestra comentarios

### Clasificación de Errores

El servicio clasifica errores por prefijo en el mensaje del `Error`, y el controller mapea cada prefijo a un código HTTP:

| Prefijo del Error | HTTP | Significado |
|---|---|---|
| `AuthError` | 401 | Credenciales inválidas o token exchange fallido |
| `ExpiredTokenError` | 401 | Token expirado sin posibilidad de refresh |
| `NotFoundError` | 404 | Post, comentario o recurso no encontrado |
| `RateLimitError` | 429 | Límite de API de Meta alcanzado |
| `ValidationError` | 400 | Error de validación o error devuelto por la API de Meta |
| *(sin prefijo)* | 500 | Error interno inesperado |

### Endpoints de la API

Todas las rutas requieren autenticación JWT (`authenticateToken`) y se montan condicionalmente en `server/src/index.ts`:

```typescript
if (verificarConfiguracionInstagram()) {
  app.use('/api/instagram', instagramRoutes);
}
```

| Método | Ruta | Controller | Descripción |
|---|---|---|---|
| `GET` | `/api/instagram/products/:productId/post` | `getPostStatus` | Estado del post para un producto |
| `POST` | `/api/instagram/upload` | `uploadMedia` | Sube imagen a Instagram (body: `productId`, `imageUrl`, `caption`) |
| `POST` | `/api/instagram/publish` | `publishPost` | Publica container (body: `productId`, `containerId`, `caption`) |
| `GET` | `/api/instagram/products/:productId/metrics` | `getMetrics` | Métricas de un post (`?period`, `?instagramPostId`) |
| `GET` | `/api/instagram/posts/:postId/comments` | `getComments` | Comentarios de un post |
| `POST` | `/api/instagram/comments/:commentId/reply` | `replyToComment` | Responde un comentario (body: `text`) |
| `POST` | `/api/instagram/comments/:commentId/hide` | `hideComment` | Oculta un comentario |
| `POST` | `/api/instagram/comments/:commentId/unhide` | `unhideComment` | Muestra un comentario |
| `POST` | `/api/instagram/token/refresh` | `refreshToken` | Fuerza refresh manual del token |

### Cliente Web (React)

5 componentes en `client/src/components/`, visibles solo cuando Instagram está configurado:

| Componente | Archivo | Propósito |
|---|---|---|
| **InstagramPublishButton** | `InstagramPublishButton.tsx` | Botón que inicia el flujo de publicación |
| **InstagramCaptionEditor** | `InstagramCaptionEditor.tsx` | Diálogo para editar caption (límite 2200 chars) + upload de imagen |
| **InstagramMetricsCard** | `InstagramMetricsCard.tsx` | Card con métricas y selector de período (7d / 30d / all) |
| **InstagramCommentManager** | `InstagramCommentManager.tsx` | Lista de comentarios con reply y hide/unhide |
| **InstagramSettings** | `InstagramSettings.tsx` | Página de configuración: estado del token, refresh manual, aviso si no configurado |

9 métodos API en `client/src/services/api.ts` dentro del namespace `instagram.*` que corresponden 1:1 con los endpoints del servidor.

### Base de Datos

Migración disponible en `migrations/create_instagram_posts.sql` (no ejecutada automáticamente):

```sql
CREATE TABLE instagram_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  instagram_post_id VARCHAR(100) DEFAULT NULL,
  status ENUM('draft', 'publishing', 'published', 'failed') NOT NULL DEFAULT 'draft',
  caption TEXT,
  media_url VARCHAR(500) DEFAULT NULL,
  published_at DATETIME DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **⚠️ Estado actual:** La migración existe como archivo SQL pero no se ha ejecutado en la base de datos. El método `getPostStatus` del controller es un stub que siempre devuelve `status: 'not_found'`. Pendiente de integrar el INSERT en el flujo de publish y el SELECT para el controller.

### Consideraciones de Seguridad (post-review R1 y R4)

- ✅ El token de acceso se envía como `Authorization: Bearer` en todas las llamadas a la Graph API (no va en URL ni en body)
- ⚠️ `client_secret` viaja como parámetro URL en los endpoints OAuth de refresh/exchange (requerido por el spec de Meta, no se puede cambiar)
- ⚠️ Sin retry/backoff ni circuit breaker — no recomendado para producción sin `axios-retry`
- ⚠️ El caché de métricas es en memoria (Map), se pierde al reiniciar el servidor
- ⚠️ Las fotos para Instagram se envían como URL (no se validan localmente formato/tamaño antes de enviar a Meta)

### Guía de Configuración Inicial

Para activar la integración se necesita:

1. **Crear una App en Meta for Developers** (developers.facebook.com) → obtener `META_APP_ID` y `META_APP_SECRET`
2. **Convertir la cuenta de Instagram a Business o Creator** (Configuración → Cuenta → Cambiar a cuenta profesional)
3. **Crear o vincular una Fan Page de Facebook** (requisito técnico de Meta, no necesita contenido)
4. **Conectar la cuenta de Instagram Business a la Fan Page** (desde la página en Facebook: Configuración → Instagram)
5. **Generar un token de larga duración** (60 días) vía Meta Graph API Explorer o la herramienta de tokens de Meta
6. **Obtener el `INSTAGRAM_BUSINESS_ID`** desde el token (devuelve `ig-user-id` en la respuesta del exchange)
7. **Configurar las 4 variables de entorno** en `.env` o en el entorno de producción

---

## 10. Reglas de Negocio

### Categorías
- Nombre único (UNIQUE en MySQL). Duplicado responde 409.
- Soft-delete: `DELETE` físico (no hay `activo` para borrado — se borra realmente).
- Al borrar una categoría con productos, MySQL `RESTRICT` impide el borrado.

### Productos
- Nombre no necesariamente único, pero SKU sí (si se provee).
- Soft-delete: `activo = TRUE/FALSE`. Las queries públicas filtran `WHERE activo = TRUE`.
- Vista admin (`?admin=true`) muestra todos, incluso inactivos.
- Relacionados con: categoría (N:1), stock (1:1), fotos (1:N), recetas (M:N), ventas (M:N).

### Ingredientes
- Nombre único (UNIQUE en MySQL). 
- Unidad de medida: `kg | gramos | litros | ml | unidades`.
- `create()`: si ya existe un ingrediente con ese nombre (incluso inactivo), lo reactiva y actualiza sus datos.
- `update()`: construye dinámicamente el SET con solo los campos provistos (partial update). 
- `delete()`: soft-delete (activo = FALSE).
- Al borrar un ingrediente referenciado en recetas, MySQL `RESTRICT` impide el borrado.

### Recetas
- Soft-delete: `activo`.
- Relación M:N con ingredientes vía `receta_ingrediente` (con cantidad y unidad_medida propia).
- Relación M:N con productos vía `producto_receta`.

### Stock
- 1:1 con producto (UNIQUE en `producto_id`).
- Trigger: al insertar una venta, descuenta automáticamente.
- Alerta de stock bajo: `cantidad_disponible <= cantidad_minima`.
- Vista `v_productos_stock_bajo` para reportes.

### Ventas
- Cabecera (`ventas`) + detalle (`venta_detalle`).
- Estado: `pendiente | completada | cancelada`.
- Métodos de pago: `efectivo | tarjeta | transferencia | mercado_pago | cuenta_dni | modo | otro`.
- Cliente opcional (NULL para venta sin cliente registrado).
- Transacción: la creación de venta usa `beginTransaction` + `commit/rollback`.
- Subtotal se calcula como suma de subtotales de productos.
- Total = subtotal - descuento.
- MP inicia en estado `pendiente`, se completa/cancela vía webhook.
- Stock se decrementa condicionalmente: inmediato para no-MP, al aprobar para MP.
- El endpoint `PATCH /api/ventas/:id/status` permite actualización manual del estado (solo admin).

### Mercado Pago
- Preferencia creation valida que la venta exista y tenga-items.
- Webhook verifica firma IPN (HMAC-SHA256).
- Rate limiting: 30 req/min por IP en el endpoint webhook.
- Idempotency: duplicados se ignoran verificando `referencia_externa`.

### Clientes
- CRUD completo: crear, editar, eliminar (soft-delete), listar con paginación.
- Búsqueda por nombre, email o teléfono.
- Email único (validación server + client con Zod).
- Soft-delete: `activo`.
- Los clientes son opcionales para ventas.

### Usuarios
- Email único (UNIQUE).
- Roles: `admin` | `usuario`.
- Soft-delete: `activo`.
- Contraseña hasheada con bcrypt (10 salt rounds).
- Login actualiza `ultimo_login`.

### Bot de Telegram
- **Whitelist**: solo responde a chat IDs listados en `BOT_CHAT_IDS`. Rechazo silencioso para no autorizados.
- **Parser first**: toda validación de formato se hace en el parser (regex), antes de llamar al service. El usuario recibe feedback inmediato sin roundtrip a DB.
- **Unidades de medida**: validadas por regex en el parser (`VALID_UNITS`), mismas que en la BD.

---

## 11. Guía de Uso del Bot de Telegram

### Categorías

```
/categorias                          → Listar todas las categorías
/categoria crear <nombre> [desc]     → Crear categoría
/categoria editar <id> <nombre> [desc]
/categoria eliminar <id>             → Borrar (solo si no tiene productos)
```

### Productos

```
/productos [cat_id]                  → Listar (con filtro opcional por categoría)
/producto crear <cat_id> <nombre> <precio> [costo]
/producto editar <id> <campo> <valor>
```

Campos editables de producto: `nombre`, `precio`, `costo`, `descripcion`, `sku`, `categoria_id`.

### Ingredientes

```
/ingredientes                        → Listar todos
/ingrediente crear <nombre> <costo> <unidad>
/ingrediente editar <id> <nombre> <costo> <unidad>
/ingrediente eliminar <id>           → Soft-delete
```

Unidades válidas: `kg`, `gramos`, `litros`, `ml`, `unidades`.

### Stock

```
/stock [limite]                      → Stock bajo (default: < 5 unidades)
/stock set <id> <cantidad>           → Actualizar stock
```

### Ventas

```
/venta <id>:<cant> [id:cant...]      → Registrar venta rápida
```

Ejemplo: `/venta 1:2 3:5` = vende 2 unidades del producto 1 y 5 del producto 3.

### Fotos

```
Enviar una foto con el ID del producto como caption.
```

### Ayuda

```
/start → Mensaje de bienvenida
/ayuda → Lista completa de comandos
```

---

## 12. Buenas Prácticas y Convenciones

### Código

1. **TypeScript estricto**: `strict: true` en tsconfig. Tipar todo, evitar `any` siempre que sea posible.
2. **DTOs separados**: las interfaces reflejan los datos que entran/salen de la API, no necesariamente las tablas.
3. **Servicios sin estado**: los métodos de servicio reciben parámetros explícitos y devuelven datos, sin depender de estado interno (excepción: pool de conexiones es singleton).
4. **Partial updates**: `IngredienteService.update()` es el único que implementa SET dinámico correctamente. `CategoriaService` y `ProductoService` mergean objeto completo (cuidado: cualquier omisión puede re-escribir NULL).
5. **Responsabilidad única**: cada handler/controller hace solo su tarea. Si necesita lógica compartida, va al service.
6. **Parseo validado antes de ejecutar**: en el bot, el parser valida formato antes de cualquier llamada a servicio.

### Testing

1. **Tests unitarios con mocks**: los tests del bot mockean el pool de MySQL con `mockQuery` (vitest spy).
2. **Descriptions en español**: los `describe` e `it` están en español (ej: "debe crear un ingrediente").
3. **Cobertura**: testear parsers (éxito + error), handlers (éxito + error del service + error del parser), services (CRUD + edge cases).

### Git

1. **Commits convencionales**: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
2. **Sin atribución AI**: no agregar "Co-Authored-By" ni atribuciones de IA
3. **Commits atómicos**: cada commit es un cambio lógico completo

### .env

- No committear. Template en `.env.example`.
- `BOT_POLLING=true` para desarrollo local (evita conflicto con webhook).
- `BOT_CHAT_IDS` para restringir acceso al bot.
- `META_APP_ID`, `META_APP_SECRET` — credenciales de la app en Meta for Developers.
- `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ID` — token de acceso e ID de Instagram Business.
- Si las 4 variables de Instagram están presentes, el servidor monta automáticamente las rutas de la API de Instagram.
- `MP_ACCESS_TOKEN` — Token de acceso de Mercado Pago.
- `MP_PUBLIC_KEY` — Public key de Mercado Pago.
- `CLIENT_URL` — URL del frontend (para return URL de MP).

---

## 13. Comandos de Desarrollo Útiles

```bash
# Iniciar todo (server + client + bot polling)
npm run dev

# Solo server web + client (sin bot)
npm run dev:web

# Solo bot en modo polling (proceso separado)
npm run bot:dev

# Tests (ambos proyectos)
npm test

# Tests solo server
npm run test:server

# Tests solo client
npm run test:client

# Coverage
npm run test:coverage

# Build producción
npm run build

# Lint
npm run lint

# Formatear código
npm run format
```
