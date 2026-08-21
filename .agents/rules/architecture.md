---
description: "Reglas arquitectónicas inamovibles de PoinTA"
---

# Reglas Inamovibles de Arquitectura (PoinTA)

Al trabajar en este proyecto, **NUNCA** rompas estas reglas base:

1. **Stack de UI:** Usa SIEMPRE Nuxt UI v4 + Tailwind v4. Los componentes clave comparten la prop `isAdmin` para evitar duplicar código (DRY UI).
2. **Modelo de Usuarios (Fuente de Verdad):** Prisma (PostgreSQL) es la fuente de verdad para roles y accesos. Supabase Auth SOLO maneja JWT y credenciales.
3. **No Auto-Creación:** El middleware `auth.ts` no debe auto-crear usuarios si no existen en la BD.
4. **Control de Accesos Contextual:** Toda mutación de datos debe protegerse con `assertTaCanModify(event, subjectId)` o `assertAdmin(event)`.

> ⚠️ **IMPORTANTE:** Si vas a modificar endpoints de Auth, permisos, o proponer nuevas tablas para el modelo de negocio, **DEBES leer obligatoriamente** el documento completo en `docs/ARCHITECTURE.md` antes de escribir cualquier código.
