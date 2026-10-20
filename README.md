# Gestor de Mercados - Frontend Angular

Frontend en **Angular (Standalone Components)** para el sistema de administración de un mercado de barrio, que gestiona puestos comerciales, dueños, servicios básicos, deudas y cobros con emisión e impresión de vouchers.

---

## 🎨 Características de Diseño y Estilo

- **Bootstrap 5** y **Bootstrap Icons** integrados para un diseño limpio, profesional y 100% responsivo.
- **Paleta de Colores**: Verde principal (`#2e7d32`), fondo gris claro (`#f4f6f8`), tarjetas blancas con sombra suave (`card-hover`).
- **Feedback Interactivo**:
  - Notificaciones **Toast** automáticas en la esquina superior derecha para éxito y errores con mensajes devueltos por el backend.
  - Modales de confirmación con advertencias antes de operaciones críticas (eliminar dueño, eliminar puesto, pagar deuda).
  - Indicadores de carga (`app-loading`) en todas las operaciones asíncronas.
  - Impresión directa de comprobantes y vouchers en formato HTML.

---

## 🏗️ Arquitectura del Proyecto

```
GestorDeMercadosFront/
├── src/
│   ├── environments/
│   │   ├── environment.ts              # apiUrl: 'http://localhost:5083/api'
│   │   └── environment.development.ts  # apiUrl de desarrollo
│   │
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts       # Protege rutas verificando sesión activa
│   │   │   │   └── role.guard.ts       # Protege vistas según rol: 'Admin' o 'User'
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts # Agrega 'Authorization: Bearer <token>', maneja 401, 403 y 400
│   │   │   ├── models/
│   │   │   │   └── index.ts            # Modelos e interfaces TypeScript (Dueno, Tienda, Deuda, etc.)
│   │   │   └── services/
│   │   │       ├── auth.service.ts     # Login, logout, gestión de sesión y almacenamiento en localStorage
│   │   │       ├── dueno.service.ts    # CRUD de dueños y consulta de puestos por dueño
│   │   │       ├── tienda.service.ts   # CRUD de tiendas y actualización completa de puestos
│   │   │       ├── servicio.service.ts # CRUD de servicios y días de corte
│   │   │       ├── deuda.service.ts    # Deudas con manejo de 404 para lista vacía
│   │   │       ├── pago.service.ts     # Registro de cobros, reporte de hoy y voucher HTML
│   │   │       ├── usuario.service.ts  # CRUD de usuarios del sistema
│   │   │       ├── rol.service.ts      # Consulta de roles
│   │   │       └── toast.service.ts    # Notificaciones reactivas en tiempo real
│   │   │
│   │   ├── shared/
│   │   │   └── components/
│   │   │       ├── toast/              # Contenedor de notificaciones flotantes
│   │   │       ├── confirm-modal/      # Modal reusable para confirmación de acciones
│   │   │       └── loading/            # Spinner animado para estados de carga
│   │   │
│   │   └── features/
│   │       ├── auth/
│   │       │   └── login/              # Pantalla de acceso centrada con credenciales rápidas
│   │       ├── admin/
│   │       │   ├── admin-layout/       # Sidebar responsive y barra superior
│   │       │   ├── dashboard/          # Métricas globales (tiendas, dueños, deudas, cobros de hoy)
│   │       │   ├── mapa-puestos/       # Cuadrícula interactiva de 40 puestos con filtros y edición
│   │       │   ├── duenos/             # CRUD de dueños con asignación de usuario y modal de advertencia
│   │       │   ├── servicios/          # Tarifario de servicios y días de corte
│   │       │   ├── deudas/             # Control de deudas con filtros de estado
│   │       │   ├── pagos/              # Registro de pagos, voucher e informe de recaudación diaria
│   │       │   └── usuarios/           # Gestión de cuentas y asignación de roles
│   │       └── user/
│   │           ├── user-layout/        # Barra superior adaptada para dueños
│   │           ├── inicio/             # Resumen de puestos asignados y deuda total
│   │           ├── mis-deudas/         # Recibos pendientes con botón de pago directo y confirmación
│   │           ├── mis-pagos/          # Historial de pagos y visualización/impresión de vouchers
│   │           └── cambiar-contrasena/ # Formulario seguro de cambio de clave
│   │
│   ├── styles.css                      # Estilos globales, paleta verde #2e7d32 y componentes Bootstrap
│   ├── main.ts                         # Bootstrap de la aplicación con ApplicationConfig
│   └── index.html                      # Página principal en español
├── package.json
└── angular.json
```

---

## ⚙️ Reglas de Negocio Implementadas

1. **Gestión de Sesión y Roles**:
   - `LoginResponse` almacena `token`, `usuario`, `rol` y `duenoId`.
   - Si el rol es `Admin`, redirige a `/admin/dashboard`. Si es `User`, redirige a `/user/inicio`.
   - Las rutas están protegidas con `authGuard` y `roleGuard`.
2. **Mapa de Puestos (40 puestos)**:
   - **Gris**: Pertenece a la Asociación (`tieneDueno = false`).
   - **Verde**: Con dueño asignado (`tieneDueno = true`).
   - **Borde rojo**: Tiene deudas pendientes de cobro.
   - En el formulario de edición se envía siempre el objeto `Tienda` completo: `{ id, tieneDueno, alquiler, costoAlquiler, duenoId }`.
3. **Dueños y Asociación**:
   - La Asociación (`ruc: 00000000000`) no puede ser eliminada.
   - Al eliminar un dueño, se presenta una advertencia confirmando que sus puestos regresarán a la Asociación.
4. **Deudas y Pagos**:
   - El monto del pago se prellena y valida para ser exactamente igual a `montoDeuda`.
   - Si la consulta de deudas del dueño devuelve 404, se muestra un estado limpio: *"No tienes deudas pendientes"*.
   - Los vouchers HTML se solicitan con `responseType: 'text'` y permiten impresión directa en navegador.

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Requisitos Previos
- **Node.js**: v18 o superior (v24 recomendado).
- **pnpm** (o npm).

### 2. Instalación de Dependencias
```bash
pnpm install
# O si prefieres npm:
# npm install
```

### 3. Servidor de Desarrollo
Para iniciar la aplicación en modo desarrollo:
```bash
pnpm start
# O alternativamente:
# pnpm dlx @angular/cli serve
```

Abre tu navegador en:
```
http://localhost:4200/
```

### 4. Compilación para Producción
```bash
pnpm run build
```
Los archivos optimizados se generarán en la carpeta `dist/gestor-mercados-front/browser`.

---

## 🔑 Credenciales de Prueba

- **Administrador (Asociación)**:
  - **Usuario:** `asociacion`
  - **Contraseña:** `Admin123!`
  - **Rol:** `Admin`
