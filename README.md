# PoinTA — Plataforma de Ayudantías

PoinTA es una plataforma web centralizada diseñada para la gestión, estructuración y difusión de ayudantías universitarias (especialmente enfocada en carreras de informática e ingeniería). Su propósito es centralizar la comunicación y el acceso al material de estudio, eliminando la fragmentación de la información (correos, links sueltos, chats).

Ofrece una vista pública optimizada para los estudiantes y un panel administrativo completo y seguro para los ayudantes (TAs) y administradores.

---

##  Estado Actual y Lo Que Se Ha Construido

El proyecto cuenta con una base sólida y funcional, abarcando los módulos core para su despliegue inicial.

### Logros Implementados
- **Arquitectura Base Estable:** Integración fluida de Nuxt 4, Prisma (PostgreSQL) y Supabase Auth.
- **Sistema de Diseño Implementado:** Soporte nativo para modo claro y oscuro, paleta de colores personalizada ("Tinta & Papel") y un sistema tipográfico limpio.
- **Módulos Core Completos:** Gestión de asignaturas, unidades jerárquicas, materiales adjuntos, sesiones cronometradas (horarios) y anuncios.
- **Módulo de Encuestas Funcional:** Creación interactiva de encuestas ligadas a anuncios, con validación de votantes a nivel de correo institucional.
- **Autenticación y Reconciliación de Usuarios Robustas:** Separación estricta de roles (`ADMIN` vs `TA`). Implementación de sincronización bidireccional entre la base de datos de Prisma y Supabase Auth, resolviendo inconsistencias de UUIDs, previniendo la creación de usuarios "fantasma" y manejando fallos con tolerancia mediante reconciliación de correos.
- **Control de Acceso Contextual (RBAC):** Restricción de permisos para que los ayudantes solo puedan modificar la información de las asignaturas a las que están asignados, mientras los administradores mantienen control global.

### Pendientes y Deuda Técnica Inmediata
Actualmente faltan características clave que deben resolverse para una experiencia completamente autónoma:
1. **Subida Directa de Archivos:** Integrar Supabase Storage u otro proveedor de buckets para permitir "drag & drop" de archivos directamente en la plataforma, reemplazando la necesidad actual de ingresar URLs externas de Google Drive/Dropbox.
2. **Recuperación de Contraseñas:** Flujo de "Olvidé mi contraseña" para ayudantes, aprovechando el servicio SMTP de Supabase Auth.
3. **Exportación de Resultados:** Funcionalidad para descargar reportes detallados (.csv / .xlsx) de las encuestas para el análisis de los equipos docentes.
4. **Paginación y Filtros Avanzados:** Implementación de paginación en el panel de anuncios o historial y mejoras en los filtros de tablas administrativas.
5. **Validación de Correo Parametrizada:** Flexibilizar las reglas de restricción de correos (`@alumnos...`) para que sean configurables por dominio institucional o listas blancas.

---

##  Decisiones de Arquitectura Técnica

El stack se diseñó privilegiando la seguridad, el tipado fuerte de extremo a extremo y la velocidad de renderizado:

* **Framework Full-Stack:** [Nuxt 4](https://nuxt.com/) con Vue 3 (Composition API). Manejo de renderizado híbrido (SSR para vistas públicas por SEO y velocidad; CSR protegido para paneles de administración).
* **Base de Datos y ORM:** [Prisma v7](https://www.prisma.io/) con adaptador para PostgreSQL. Esquema relacional estructurado que soporta relaciones muchos-a-muchos (Usuarios ↔ Asignaturas) y estructuras de árbol (Unidades anidadas).
* **Autenticación y Sesiones:** [Supabase Auth](https://supabase.com/auth). Manejo de JWT, sesiones seguras en cookies y validaciones de credenciales.
* **Modelo Híbrido de Autorización (Authz):** 
  - La *autenticación* la maneja Supabase, pero la *autorización y roles* reside en la base de datos de Prisma y variables de entorno (`ADMIN_EMAILS`).
  - Capa de middlewares (`assertTa`, `assertAdmin`, `assertTaCanModify`) implementada en el servidor Nitro para validar peticiones API de forma declarativa.
* **API RESTful (Nitro):** Endpoints organizados por recursos (`/api/subjects`, `/api/admin/users`, etc.) validando payloads y roles antes de tocar la base de datos.

---

##  Decisiones de Estilo, Diseño y UI/UX

Se buscó una estética seria, académica pero moderna, alejándose de los estilos "bootstrap" por defecto:

* **Tema Visual "Tinta & Papel":** Paleta personalizada construida sobre el espacio de color OKLCH. Utiliza fondos cálidos (Stone) y acentos contrastantes (Indigo / Teal / Ink) para emular la claridad de un documento impreso de alta calidad.
* **Tipografía:** 
  * `Space Grotesk` para titulares (aspecto técnico y distintivo).
  * `Inter` para cuerpos de texto, tablas y datos (legibilidad máxima).
* **Librerías de Componentes:** [@nuxt/ui v4](https://ui.nuxt.com/) estilizado mediante **Tailwind CSS v4**.
* **Reutilización de Vistas (DRY UI):** Componentes clave como `AnnouncementsView`, `MaterialsView` y `ScheduleView` son polimórficos. Reciben una propiedad dinámica (`isAdmin`) para transformar interfaces de "solo lectura" (estudiantes) en paneles interactivos con capacidades CRUD, drag & drop (vía SortableJS) y modales de configuración.
* **Micro-interacciones y Feedback:** Uso consistente de animaciones de transición de layout, estados vacíos estilizados, skeleton loaders para esperas asíncronas y alertas (toasts) para feedback transaccional.

---

##  Funcionalidades Principales

### Portal Estudiantil (Acceso Público)
* **Directorio de Asignaturas:** Buscador en tiempo real por nombre de ramo o código, listando los ayudantes asignados.
* **Horarios y Sesiones:** Visualización clara de bloques semanales recurrentes, sesiones de recuperación extraordinarias y enlaces a salas virtuales.
* **Repositorio de Materiales:** Navegación por sistema de carpetas (Unidades y Subunidades) para descargar guías, resúmenes o enunciados.
* **Comunicados y Votaciones:** Lectura de anuncios importantes y capacidad de votar en encuestas interactivas verificando la identidad mediante un correo autorizado temporal.

### Portal de Administración (Acceso Protegido)
* **Gestor de Usuarios y Roles:** Creación de cuentas de ayudantes, reseteo de estados (activo/inactivo) y asignación a asignaturas específicas.
* **Control de Contenidos Académicos:** Interfaz drag & drop para reordenar el árbol de Unidades de una asignatura, adjuntar enlaces de material y configurar la jerarquía de estudio.
* **Configuración de Horarios:** Creación y modificación de bloques de ayudantía y eventos especiales.
* **Módulo de Publicaciones:** Editor para comunicados y configurador de encuestas (opciones, fechas de cierre, visualización en vivo de métricas de votos).

---

## 🛠️ Instalación y Desarrollo Local

### Requisitos Previos
- Node.js (v18+)
- PostgreSQL (Base de datos local o remota)
- Proyecto configurado en Supabase (para Auth)

### Configuración del Entorno
1. Clonar el repositorio y acceder a la carpeta del proyecto.
2. Copiar el archivo de entorno base: `cp .env.example .env`
3. Configurar las variables en `.env`:
   - `DATABASE_URL`: URI de conexión a PostgreSQL.
   - `SUPABASE_URL` y `SUPABASE_KEY`: Credenciales del proyecto en Supabase.
   - `SUPABASE_SERVICE_KEY`: Llave de servicio (Service Role) para gestión administrativa de Auth.
   - `ADMIN_EMAILS`: Lista separada por comas de correos con rol Administrador.

### Puesta en Marcha
Instalar las dependencias y levantar el servidor:

```bash
# Instalar dependencias
npm install

# Generar el cliente de Prisma y ejecutar migraciones pendientes
npx prisma generate
npx prisma db push

# Levantar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

### Scripts Útiles
- `npm run build`: Genera la versión de producción optimizada (Nitro build).
- `npm run test`: Ejecuta la suite de pruebas unitarias y e2e (Vitest).
- `npx prisma studio`: Interfaz gráfica para gestionar los datos locales de Prisma.
