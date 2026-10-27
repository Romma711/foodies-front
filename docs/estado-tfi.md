# Foodies — Estado del TFI y próximos pasos

Corte al 26/10/2026, a una semana de la entrega (2/11/2026). Resume todo lo hecho en los módulos de
**reseñas** y **administración**, lo que falta para entregar y una propuesta de próximos sprints.

> No se encontró la consigna oficial del TFI en el repositorio ni en el escritorio. La revisión de
> faltantes se hizo contra el roadmap del equipo, las reglas de stack/diseño y lo que suele evaluarse
> en un TFI. **Conviene contrastarla con la consigna real.**

Detalle técnico por módulo:

- `src/app/features/resenas/README.md` — Sprints 1 a 5 y 10.
- `src/app/features/admin/README.md` — Sprints 6 a 9 y checklist de revisión.

---

## 1. Qué se hizo

| Sprint | Entregable                                                      | Commits                               |
| ------ | --------------------------------------------------------------- | ------------------------------------- |
| 1      | Modelos y servicio HTTP de reseñas con signals                  | `fc675a3`, `28c60d4`                  |
| 2      | `StarRating` y `ResenaCard` estilo WOKI                         | `78a3c1b`, `b530497`, `818c98d`       |
| 3      | Formulario de creación y edición inline con validaciones        | `d037c46`, `083ca08`                  |
| 4      | Gráfico de distribución (Chart.js) y borrado por rol            | `d2dbfe6`, `b5b73ce`                  |
| 5      | Reseñas dentro de la página del restaurante, skeletons y toasts | `602a6fd`, `609c4b7`                  |
| 6      | Backend: métricas del admin + `Usuario.fechaRegistro`           | back `824ca5d`, `19f87c0`             |
| 7      | `adminGuard` y layout del panel con sidebar                     | `c4a4ead`                             |
| 8      | Dashboard de métricas con Chart.js                              | `bf0b411`, `af17b8b`                  |
| 9      | Moderación de reseñas (backend + tabla con borrado rápido)      | back `1e49c85` · `698282e`, `ae6416b` |
| 10     | Ordenar y filtrar reseñas por calificación                      | `ebc62b7`                             |
| 11     | Auditoría de accesibilidad con axe y arreglos de contraste      | `ea4a79f`, `5b31cfe`                  |
| —      | Deseables: Swagger, CI, `npm audit` y environment de producción | ver "Deseables resueltos"             |

Documentación: `d777f62`, `0e20878` (front) y `314463b` (README del backend con los endpoints de admin).

**Calidad actual:** 195 tests de frontend y 27 de backend en verde; build de producción sin errores;
`npm audit` sin vulnerabilidades.

### Sprint 11 — Accesibilidad (detalle)

- `axe-core` como dependencia de desarrollo y helper `shared/testing/axe.ts`. Un test prueba que el
  helper detecta errores reales (botón sin nombre, input sin label) para que no pase en vacío.
- 14 escenarios auditados: cada componente de reseñas y del panel admin en sus estados reales
  (cargando, vacío, con error, con confirmación abierta, con errores de validación, menú mobile).
  **Todos pasan sin violaciones.**
- axe no mide contraste en jsdom, así que se calculó con la fórmula de WCAG sobre los tokens:

  | Par                                   | Antes                                  | Arreglo                                                                                                                                                          |
  | ------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Placeholder del formulario de reseñas | 2.93:1 ❌                              | `ink-400` → `ink-500` (4.52:1 ✅)                                                                                                                                |
  | Estrellas llenas vs. blanco / vacías  | 2.04:1 y 1.54:1 ❌ (gráfico, mín. 3:1) | Número visible junto a las estrellas en cards y moderación; en el formulario "4 de 5" (WCAG 1.4.11 se cumple porque la información ya no depende solo del color) |
  | Anillo de foco global sobre crema     | 2.86:1 ❌                              | `brand-500` → `brand-700` en `styles.css` (5.24:1 ✅)                                                                                                            |

  El resto de los pares de texto del módulo pasan AA (4.5:1 o más).

---

## 2. Qué falta para entregar

### 🔴 Bloqueante (antes del 2/11)

1. **Merge del equipo (27/10).** Todo lo de este trabajo está en ramas separadas:
   - Front en `Reservas` (no en `master`), con ~844 líneas sin commitear de compañeros.
   - Back en `feature/admin-metricas`, con 10 archivos sin commitear de compañeros.
2. **Cableado sin commitear que hay que preservar en el merge:**
   - `app.routes.ts`: rutas de admin (`adminGuard`, `loadChildren`) y redirect `/resenas/:id`.
   - `restaurante-detail`: bloque de reseñas y botón "Ver reseñas"; su spec stubea el bloque.
   - `header.html` / `footer.html`: sin el link fijo a `/resenas/5`.
3. **El borrado como admin depende de código sin commitear del backend** (`esAdmin` en
   `ResenaController`/`ResenaService`). Si se pierde en el merge, moderar devuelve 403.
4. **README raíz del frontend** es el de plantilla de Angular CLI: no describe el proyecto, el equipo
   ni cómo levantarlo junto al backend.

### 🟡 Importante

5. **Accesibilidad fuera del módulo:** `login.html` y `register.html` usan el mismo placeholder
   `ink-400` (2.93:1). Es un cambio de una clase por input, pero son archivos de otro módulo.
6. **Colección de Postman fuera del repo** (`Tp final foodies.postman_collection.json` en el
   escritorio). Si la cátedra pide evidencias de la API, conviene versionarla en `foodies-repo/docs`.
7. **Sin tests e2e.** Hay unit/integration tests, pero ningún recorrido de punta a punta en el
   navegador (login → reseñar → moderar).
8. **Cobertura de backend desigual:** 7 clases de test; reseñas y admin cubiertos, reservas y auth
   solo por el flujo completo.
9. **Limpieza post-merge:** `pages/admin/admin-home` y `features/resenas/pages/resena-list` quedan sin
   uso cuando el cableado se commitee.

### 🟢 Deseable

10. ✅ **Swagger** — `springdoc-openapi` 2.8.8. Swagger UI en `http://localhost:8080/swagger-ui.html`, con
    el botón "Authorize" para pegar el JWT. Rutas públicas agregadas en `SecurityConfig`. Test
    `OpenApiDocsTest`. Back `cfb8ed3`.
11. ✅ **CI con GitHub Actions** en los dos repos (corre en cada push y PR):
    - Front (`ac8a44d`): `npm ci` → `format:check` → `test:ci` → `build`.
    - Back (`7c704f2`): `./mvnw verify` con H2, sin MySQL.
    - `format:check` solo revisa `resenas`, `admin`, `shared` y `environments`: 32 archivos de otros
      módulos no pasan Prettier hoy. Después del merge se puede ampliar a `src` con `npx prettier --write src`.
    - No se agregó ESLint: sumaría dependencias y fallaría sobre código de otros módulos el día antes del merge.
12. ✅ **`npm audit`: 0 vulnerabilidades** (`894b95f`). `@angular/build` 22.2.x (incluso la última, 22.2.4)
    fija `vite` 8.3.0, así que se forzó `vite` 8.3.4 con `overrides` en `package.json`. Quitarlo
    cuando Angular publique una versión que traiga vite parchado.
13. ✅ **Environment de producción** (`02e7361`): `environment.prod.ts` reemplaza al de desarrollo en
    `ng build`. Usa `apiUrl: '/api'`, así que el servidor del deploy tiene que redirigir `/api` al
    backend (como hace `proxy.conf.json` en local).
14. ⏸️ **Fecha en las reseñas: pospuesto a propósito.** Requiere tocar `Resena`, `ResenaListDTO` y
    `ResenaMapper`, y esos archivos tienen hoy cambios sin commitear de compañeros. Hacerlo antes del
    merge garantiza conflictos. Conviene hacerlo en el Sprint 12, después del merge.

---

## 3. Propuesta de próximos sprints

Ordenados por impacto en la entrega. Marcados los que requieren backend o tocan archivos compartidos.

| #   | Sprint                                                                                                        | Por qué                               | Toca                   |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------- |
| 12  | **Post-merge:** commitear el cableado, limpiar páginas viejas, verificar borrado admin y correr toda la suite | Sin esto lo hecho no llega a `master` | Archivos compartidos   |
| 13  | **README raíz + guía de ejecución** (front + back + base de datos + cuentas de prueba) y Postman versionado   | Es lo primero que mira quien corrige  | Docs                   |
| 14  | **E2E con Playwright**: visitante, cliente (crear/editar/borrar reseña) y admin (dashboard/moderar)           | Demuestra el sistema integrado        | Front (dev dependency) |
| 15  | **Accesibilidad global**: placeholders de login/registro y axe en las páginas de los demás módulos            | Cierra AA en toda la app              | Archivos de compañeros |
| 16  | **Swagger (springdoc)** para documentar la API                                                                | Facilita la defensa oral              | Backend (dependencia)  |

Alternativas si sobra tiempo: promedio de estrellas en las cards del listado de restaurantes,
fecha en las reseñas, página "Mis reseñas" del cliente, CI con GitHub Actions.

---

## 4. Decisiones tomadas sin consulta

Para revisar y, si hace falta, revertir:

- Sprint 10 y 11 elegidos por prioridad (valor alto, solo frontend, sin chocar con compañeros).
- Orden por defecto de las reseñas: "Más recientes" (antes: orden del backend).
- Se volvió a mostrar el número de la calificación en las cards (se había quitado en el Sprint 2 por
  minimalismo) porque las estrellas solas no cumplen contraste.
- Cambio global del color de foco en `styles.css` (afecta a toda la app, para bien).
- `ToastService`/`ToastOutlet` y la fábrica de Chart.js movidos a `shared/` porque los usan dos
  módulos.
