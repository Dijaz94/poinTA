---
description: "Patrones de componentes Vue: lógica en pages, componentes presentacionales"
---

# Patrones de Componentes Vue (PoinTA)

## Regla Principal: Lógica en Pages, Componentes Presentacionales

1. **Las pages (`app/pages/`) son dueñas de la lógica:** Todo el código de negocio vive en las pages — `useFetch`, `$fetch`, handlers de submit/delete, estado reactivo (`ref`, `reactive`), validaciones, `useToast`, etc.
2. **Los componentes (`app/components/`) son presentacionales:** Reciben datos y callbacks vía `props` y `emits`. NO deben hacer llamadas a API (`useFetch`, `$fetch`), ni manejar estado de negocio. Su responsabilidad es renderizar UI.
3. **Qué SÍ es un componente:** Formularios, cards, modales, listas, layouts parciales — piezas de UI reutilizables y acotadas.
4. **Qué NO es un componente:** Una página entera envuelta en un `<template>`. Si un "componente" recibe solo un `subjectId` y hace TODO internamente (fetch, lógica, formularios), es una page disfrazada.

## Excepciones Aceptadas en Componentes

- Estado local de UI (e.g., `isOpen` de un modal, `selectedTab`).
- Lógica de interacción autocontenida menor (e.g., `PollCard` que maneja el flujo de votación del estudiante, ya que es una interacción atómica e independiente de la page).
- Modales con formularios que reciben `subjectId` y emiten `@saved` — estos encapsulan una operación CRUD atómica y son aceptables.

## Anti-patrones a Evitar

- Crear componentes "View" que son páginas completas (`AnnouncementsView`, `MaterialsView`, `ScheduleView`).
- Pages que solo hacen `<ComponenteView :subject-id="id" />` sin lógica propia.
- Duplicar lógica idéntica entre page pública y admin usando `isAdmin` prop en un componente gigante.
