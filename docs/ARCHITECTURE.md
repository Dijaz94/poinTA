# Arquitectura y Decisiones de PoinTA

Este documento consolida las decisiones técnicas, estructurales y de diseño que guían el desarrollo de PoinTA. 
Todo agente o desarrollador debe usar este contexto como referencia profunda al implementar nuevos módulos o realizar refactorizaciones importantes.

## 1. Stack Tecnológico Base
* **Frontend/Backend:** Nuxt 4 (Vue 3, Composition API) con Nitro como servidor BFF (Backend For Frontend).
* **Base de Datos:** PostgreSQL.
* **ORM:** Prisma v7 (`@prisma/client`, `@prisma/adapter-pg`).
* **Autenticación:** Supabase Auth (`@nuxtjs/supabase`).
* **UI/Estilos:** Nuxt UI v4 estandarizado con Tailwind CSS v4.

---

## 2. Modelo Híbrido de Usuarios (Prisma ↔ Supabase)
La gestión de usuarios es el componente más delicado. Funciona bajo las siguientes reglas absolutas:

1. **Supabase Auth solo gestiona credenciales:** Se encarga de validar JWT, resetear contraseñas y almacenar UUIDs.
2. **Prisma es la fuente de verdad del estado de la aplicación:** Los roles (`ADMIN` o `TA`), asignaturas, permisos y estado de bloqueo (`isActive`) viven en PostgreSQL.
3. **Rol Determinado por Entorno:** La variable `ADMIN_EMAILS` (en `.env`) es la que decide si alguien es administrador. El middleware `auth.ts` sobreescribe el rol en Prisma basándose en esta lista en cada request.
4. **Reconciliación en Escritura (NO Auto-creación):**
   * El middleware **no** crea usuarios automáticamente si no existen en Prisma. Solo rechaza el acceso con 401 si no hay registro (evita usuarios fantasma).
   * Los endpoints de edición (`[id].patch.ts`) y eliminación (`[id].delete.ts`) manejan un *fallback* por email si ocurre una desincronización de UUIDs entre Prisma y Auth.

---

## 3. Autorización y Control de Acceso (RBAC Contextual)
Toda validación de permisos se centraliza en `server/utils/authz.ts`:
* `assertTa(event)`: Verifica que exista sesión en Auth, exista en Prisma y esté activo (`isActive: true`).
* `assertAdmin(event)`: Verifica rol global `ADMIN`.
* `assertTaCanModify(event, subjectId)`: **Autorización contextual**. Permite a un ayudante modificar únicamente los recursos (materiales, horarios, encuestas) de las asignaturas específicas que tiene asignadas.

---

## 4. UI/UX: Patrón "DRY UI" y Sistema de Diseño
1. **Paleta "Tinta & Papel" (OKLCH):** Colores Indigo (Primary), Teal (Secondary), Stone (Neutral/Backgrounds) e Ink (Dark mode/Text).
2. **Fuentes:** `Space Grotesk` para display/títulos, `Inter` para cuerpo y UI general.
3. **Vistas Polimórficas (DRY):** Las vistas principales (`AnnouncementsView`, `MaterialsView`, `ScheduleView`) se diseñan pensando primero en el estudiante (solo lectura). Luego, mediante un prop booleano `isAdmin`, inyectan los modales de edición, botones CRUD y mecánicas *Drag & Drop* (SortableJS) para los ayudantes. Nunca duplicar un componente público y uno de administración si comparten el 90% de la UI base.

---

## 5. Diseño de Base de Datos (Core)
* **Subject (Asignatura):** Eje central. Relaciona Unidades, Anuncios, Sesiones y Ayudantes.
* **Unit (Unidades):** Árbol jerárquico (`parentId`, `children`) usado para estructurar el material de estudio, con un índice de ordenamiento (`order`).
* **Announcement (Comunicados/Encuestas):** Soporta tanto texto markdown como opciones de votación (PollOption). Las votaciones se auditan por correo electrónico (Vote).
* **Session (Horarios):** Bloques recurrentes semanales (enum `DayOfWeek`) o fechas específicas.
