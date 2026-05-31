# Guía de workflows CI/CD — MyFoodie

## Tabla de contenidos

1. [Estructura de ramas](#1-estructura-de-ramas)
2. [Resumen de workflows](#2-resumen-de-workflows)
3. [Cómo trabajar día a día](#3-cómo-trabajar-día-a-día)
4. [Cada workflow en detalle](#4-cada-workflow-en-detalle)
5. [Cómo cerrar issues desde commits](#5-cómo-cerrar-issues-desde-commits)
6. [Gestión de etiquetas](#6-gestión-de-etiquetas)
7. [Pendiente de configurar](#7-pendiente-de-configurar)
8. [Solución de problemas](#8-solución-de-problemas)

> **Workflows activos:** `ci-backend.yml`, `ci-frontend.yml`, `pr-checks.yml`, `auto-label.yml`, `close-issues.yml`

---

## 1. Estructura de ramas

```
main             ← producción (rama protegida)
develop          ← integración (rama protegida)
feature/<nombre> ← nueva funcionalidad
fix/<nombre>     ← corrección de bug
test/<nombre>    ← añadir o mejorar tests
```

**Regla de fusión:** nunca hacer commit directo a `main` ni `develop`. Siempre abrir una Pull Request desde `feature/` o `fix/`.

---

## 2. Resumen de workflows

| Fichero | Cuándo se dispara | Qué hace |
|---|---|---|
| `ci-backend.yml` | Push / PR hacia `develop` o `main` con cambios en `backend/` | Checkstyle, tests, compilación JAR |
| `ci-frontend.yml` | Push / PR hacia `develop` o `main` con cambios en `frontend/` | ESLint, TypeScript, Jest, Expo export |
| `pr-checks.yml` | Cada vez que se abre, edita o actualiza una PR | Valida título, descripción y mensajes de commits; auto-asigna autor |
| `auto-label.yml` | Cada vez que se abre o actualiza una PR | Añade etiquetas según rama y ficheros tocados |
| `close-issues.yml` | Push a `develop` o `main` | Cierra issues referenciados en commits |

---

## 3. Cómo trabajar día a día

### Flujo completo de una funcionalidad

```
1.  Crear la rama
    git checkout develop
    git pull origin develop
    git checkout -b feature/nombre-funcionalidad

2.  Desarrollar y hacer commits con el prefijo correcto
    git commit -m "feat: descripción de lo que hace"

3.  Subir la rama a GitHub
    git push origin feature/nombre-funcionalidad

4.  Abrir la Pull Request en GitHub hacia develop
    - Título:      feat: descripción corta (OBLIGATORIO el prefijo)
    - Descripción: explicar qué hace la PR y por qué (OBLIGATORIO)

5.  Los workflows se ejecutan automáticamente:
    - pr-checks    → valida título, descripción y mensajes de cada commit
    - auto-label   → añade etiquetas
    - ci-backend   → si tocas backend/
    - ci-frontend  → si tocas frontend/

6.  Una vez aprobada, hacer merge a develop
```

### Prefijos de commit obligatorios

| Prefijo | Cuándo usarlo |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Solo documentación |
| `refactor:` | Cambio de código sin cambio funcional |
| `test:` | Añadir o modificar tests |
| `chore:` | Tareas de mantenimiento (CI, dependencias…) |

Ejemplo: `feat: añadir pantalla de perfil de usuario`

---

## 4. Cada workflow en detalle

### CI Backend (`ci-backend.yml`)

Se activa solo cuando hay cambios dentro de `backend/`.

**Pasos que ejecuta:**
1. Checkstyle — verifica el estilo del código Java
2. Tests — `mvn test` con MongoDB real en el entorno CI
3. Compilación — `mvn package -DskipTests` para confirmar que el JAR compila
4. Artefacto — sube los resultados de tests a la pestaña "Artifacts" de GitHub Actions

**Ver resultados de tests:**
- Ve a la PR → pestaña "Checks" → "CI — Backend Spring Boot"
- O en Actions → busca el workflow → descarga el artefacto `resultados-tests-backend`

---

### CI Frontend (`ci-frontend.yml`)

Se activa solo cuando hay cambios dentro de `frontend/`.

**Pasos que ejecuta:**
1. ESLint — `npm run lint`
2. TypeScript — `npx tsc --noEmit` (detecta errores de tipos sin generar ficheros)
3. Jest — `npm test` (ejecuta los ficheros `*.test.ts` / `*.test.tsx`). Si no hay tests todavía, el paso pasa sin error gracias a `--passWithNoTests`
4. Expo export — `npx expo export --platform web` (verifica que el bundle no falla)

**Librerías de testing instaladas:**
- `jest` + `jest-expo` — runner y preset para React Native/Expo
- `@testing-library/react-native` — utilidades para renderizar y consultar componentes
- `@testing-library/jest-native` — matchers adicionales (`toBeVisible`, `toHaveTextContent`…)

**Scripts disponibles en local:**
```bash
npm test               # ejecutar todos los tests una vez
npm run test:watch     # modo watch (re-ejecuta al guardar)
npm run test:coverage  # genera informe de cobertura
```

---

### Validación de PRs (`pr-checks.yml`)

Se ejecuta cada vez que creas, editas o haces push a una PR.

**Qué valida:**
- El título sigue el formato `prefijo: descripción` (con espacio y texto después de los dos puntos)
- La descripción de la PR no está vacía
- Cada commit de la PR sigue el mismo formato — los commits de merge automáticos se ignoran

**Formato obligatorio** para título y commits:
```
feat: descripción de lo que hace
fix: corregir crash al hacer logout
docs: actualizar README
refactor: extraer lógica de validación
test: añadir tests al AuthService
chore: actualizar dependencias
```

**Si el título o la descripción fallan:**
- GitHub bloquea el merge (check en rojo)
- Se añade un comentario en la PR indicando qué corregir
- Corriges → el check se vuelve a ejecutar solo al hacer push

**Si algún commit tiene formato incorrecto:**
- El comentario lista cada commit problemático con su SHA y mensaje
- Para corregirlos: `git rebase -i` para editar los mensajes y luego `git push --force-with-lease`

**Auto-asignación:**
- Al abrir la PR, te asigna automáticamente como responsable

---

### Etiquetado automático (`auto-label.yml`)

Añade etiquetas a la PR sin que tengas que hacer nada.

| Condición | Etiqueta añadida |
|---|---|
| La rama se llama `feature/…` | `enhancement` |
| La rama se llama `fix/…` | `bug` |
| La rama se llama `test/…` | `testing` |
| Hay cambios en `backend/` | `backend` |
| Hay cambios en `frontend/` | `frontend` |
| Hay cambios en `.github/` | `ci/cd` |

Si la etiqueta no existe en el repositorio, el workflow la crea automáticamente.

---

### Cierre automático de issues (`close-issues.yml`)

Si en el mensaje de un commit incluyes una referencia a un issue, se cierra automáticamente cuando ese commit llega a `develop` o `main`.

Palabras clave válidas (no distingue mayúsculas/minúsculas):
- `closes #XX`
- `fixes #XX`
- `resolves #XX`

Ver sección 5 para ejemplos completos.

---

## 5. Cómo cerrar issues desde commits

### Cerrar un issue en un commit normal

```bash
git commit -m "feat: añadir validación del formulario closes #12"
```

### Cerrar varios issues a la vez

```bash
git commit -m "fix: corregir crash al hacer logout closes #8, fixes #9"
```

### Cerrar en la descripción larga del commit

```bash
git commit -m "feat: rediseñar pantalla de perfil

Nuevo layout más limpio con foto de perfil editable.

closes #15
closes #16"
```

### Qué ocurre automáticamente

1. Haces push a `develop` o `main`
2. El workflow detecta las referencias en los commits
3. Cierra el issue en GitHub
4. Añade un comentario en el issue con el SHA del commit que lo cerró

> **Nota:** si el issue ya estaba cerrado, el workflow lo detecta y no hace nada.

---

## 6. Gestión de etiquetas

Las etiquetas que usa el sistema CI/CD son:

| Etiqueta | Creada por | Propósito |
|---|---|---|
| `enhancement` | `auto-label.yml` (automática) | PRs de `feature/` |
| `bug` | `auto-label.yml` (automática) | PRs de `fix/` |
| `testing` | `auto-label.yml` (automática) | PRs de `test/` |
| `backend` | `auto-label.yml` (automática) | PR toca código backend |
| `frontend` | `auto-label.yml` (automática) | PR toca código frontend |
| `ci/cd` | `auto-label.yml` (automática) | PR toca `.github/` |

**Crear etiquetas manuales en GitHub:**
Repositorio → Issues → Labels → "New label"

---

## 7. Pendiente de configurar

### Checkstyle en el backend

El paso de Checkstyle en `ci-backend.yml` actualmente tiene `continue-on-error: true` porque el `pom.xml` no tiene el plugin configurado. Para activarlo:

1. Añade el plugin en `backend/pom.xml`:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.6.0</version>
    <configuration>
        <configLocation>google_checks.xml</configLocation>
        <failsOnError>true</failsOnError>
    </configuration>
</plugin>
```

2. Elimina `continue-on-error: true` del workflow una vez que el código pase el estilo.

### Proteger las ramas principales (bloquear merge si CI falla)

Esto es lo que hace que sea imposible mergear una PR si los tests o el CI están en rojo.

**Pasos en GitHub:**

1. Ve al repositorio → **Settings** → **Branches**
2. Pulsa **"Add branch protection rule"**
3. En "Branch name pattern" escribe `develop` y activa:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging** → busca y añade:
     - `Compilar y testear backend`
     - `Lint, TypeScript, tests y export de Expo`
     - `Validar título, descripción, commits y asignado`
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings**
4. Repite el mismo proceso para la rama `main`

> **Nota:** los checks solo aparecen en el buscador después de haber ejecutado el workflow al menos una vez en una PR real. Si no aparecen todavía, abre una PR de prueba para que se disparen los workflows.

---

## 8. Solución de problemas

### El CI de backend falla en tests con error de MongoDB

El workflow levanta un MongoDB en Docker como servicio. Si ves un error de conexión, comprueba que tu clase de test no sobreescriba la propiedad `spring.data.mongodb.uri`.

### El CI de frontend falla en `expo export`

Asegúrate de que `package-lock.json` está commiteado. El paso usa `npm ci` que requiere ese fichero. Si cambias dependencias, haz `npm install` y commitea el `package-lock.json` actualizado.

### La validación de PR falla aunque el título parece correcto

El título debe empezar exactamente por el prefijo con dos puntos y un espacio: `feat: ` (no `feat-`, no `[feat]`). También distingue entre minúsculas; usa siempre minúsculas.

### El cierre automático de issues no funciona

- Verifica que el issue existe en el repositorio y está abierto
- El commit con la referencia debe llegar a `develop` o `main` (no funciona en ramas `feature/`)
- El `GITHUB_TOKEN` tiene permiso de escritura en issues por defecto; no necesitas configurar nada extra

### Ver los logs de cualquier workflow

GitHub → Actions → selecciona el workflow → selecciona la ejecución → expande cada paso
