# Política de ramas, issues y commits de MyFoodie

## Objetivo
Este documento define una política de trabajo sencilla para el desarrollo de **MyFoodie**, un proyecto individual de TFG. Su finalidad es mantener el repositorio ordenado, facilitar el seguimiento del progreso y dejar una forma de trabajo clara y consistente durante todo el desarrollo.

Al tratarse de un proyecto desarrollado por una sola persona, la política se ha planteado con un enfoque práctico y ligero. No busca replicar procesos complejos de equipos grandes, sino aportar estructura sin añadir carga innecesaria.

## Principios generales
La gestión del repositorio se basa en los siguientes principios:

- Simplicidad: usar solo las ramas y normas que realmente aporten valor.
- Trazabilidad: cada cambio importante debe poder relacionarse con una tarea o necesidad concreta.
- Orden: evitar mezclar cambios distintos en un mismo commit o issue.
- Estabilidad: mantener una rama principal limpia y funcional.

## Política de ramas
Para este proyecto se propone una estrategia de ramas mínima:

| Rama | Uso |
|---|---|
| `main` | Rama principal. Debe contener versiones estables y funcionales del proyecto. |
| `develop` | Rama de integración del trabajo en curso. Aquí se consolidan avances antes de pasarlos a `main`. |
| `feature/nombre-corto` | Rama temporal para desarrollar una funcionalidad concreta. |
| `fix/nombre-corto` | Rama temporal para corregir errores o ajustes puntuales. |

### Normas de uso de ramas
- `main` no debe usarse para desarrollar directamente.
- `develop` será la rama habitual de trabajo e integración.
- Cada funcionalidad nueva debe salir desde `develop` en una rama `feature/...`.
- Cada corrección concreta puede hacerse en una rama `fix/...`.
- Una vez terminada una tarea, la rama temporal se fusionará en `develop`.
- Cuando se alcance un estado estable o una entrega importante, `develop` se fusionará en `main`.

### Ejemplos de nombres de ramas
- `feature/login-usuario`
- `feature/control-despensa`
- `feature/ocr-tickets`
- `fix/error-registro`
- `fix/ajuste-navegacion`

## Política de issues
Los issues servirán para registrar tareas, mejoras, errores y recordatorios relevantes del proyecto. Aunque el desarrollo sea individual, su uso ayuda a organizar el trabajo y a dejar constancia del avance.

### Cuándo crear un issue
Se recomienda crear un issue cuando ocurra alguna de estas situaciones:

- Hay una funcionalidad nueva que implementar.
- Se detecta un error que debe corregirse.
- Se quiere dejar anotada una mejora futura.
- Es necesario dividir una parte grande del proyecto en tareas más manejables.

### Estructura recomendada de un issue
Cada issue puede seguir una plantilla simple como esta:

- **Título**: breve y claro.
- **Descripción**: qué se quiere hacer o qué problema existe.
- **Objetivo**: resultado esperado.
- **Criterio de cierre**: cuándo se considerará completado.

### Ejemplos de issues
- `Implementar pantalla de inicio de sesión`
- `Crear modelo de producto en backend`
- `Corregir error al añadir alimentos manualmente`
- `Diseñar estructura inicial del feed de recetas`

## Política de commits
Los commits deben ser pequeños, claros y representar cambios concretos. Esto facilita revisar el historial, localizar errores y entender la evolución del proyecto.

### Normas generales para commits
- Hacer commits frecuentes, pero con sentido.
- Evitar commits que mezclen varias cosas no relacionadas.
- Escribir mensajes claros y directos.
- Subir cambios que compilen o que al menos mantengan coherencia funcional.
- No usar mensajes ambiguos como `cambios`, `update` o `cosas nuevas`.

### Formato recomendado
Se propone un formato simple basado en prefijos:

| Prefijo | Uso |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de error |
| `docs:` | Cambios en documentación |
| `refactor:` | Reorganización interna sin cambiar funcionalidad |
| `test:` | Añadir o modificar pruebas |
| `chore:` | Tareas de mantenimiento o configuración |

### Ejemplos de commits
```bash
feat: añadir pantalla de registro en React Native
feat: crear endpoint de inventario en Spring Boot
fix: corregir validación del formulario de login
docs: añadir política de ramas y commits
refactor: reorganizar servicios de recetas
test: añadir pruebas del controlador de usuarios
chore: configurar variables de entorno del backend
```

## Relación entre issues, ramas y commits
Para mantener una trazabilidad básica, se recomienda seguir este flujo:

1. Crear un issue para la tarea o problema.
2. Abrir una rama específica a partir de `develop`.
3. Realizar uno o varios commits relacionados con esa tarea.
4. Fusionar la rama en `develop` cuando esté terminada.
5. Cerrar el issue correspondiente.

Un ejemplo sencillo sería:

- Issue: `Implementar gestión básica de despensa`
- Rama: `feature/control-despensa`
- Commits:
  - `feat: crear vista de productos en despensa`
  - `feat: añadir endpoint para listar productos`
  - `fix: corregir refresco del inventario`

## Pull requests
Aunque el proyecto sea individual, puede resultar útil usar pull requests en GitHub como mecanismo de revisión personal antes de fusionar ramas. No es obligatorio en todos los casos, pero sí recomendable en cambios grandes.

### Recomendación práctica
- En tareas pequeñas, se puede fusionar directamente en `develop`.
- En tareas medianas o importantes, conviene abrir una pull request para revisar el cambio antes de integrarlo.
- La pull request debe incluir un título claro y una breve explicación del cambio realizado.

## Versionado y entregas
Para mantener cierto orden en el progreso del TFG, se recomienda marcar hitos relevantes del proyecto mediante versiones o etiquetas.

### Cuándo crear una versión
- Al completar el MVP.
- Antes de una entrega al tutor.
- Cuando se cierre una fase importante del roadmap.
- Antes de introducir cambios grandes que puedan romper estabilidad.

### Ejemplo de versiones
- `v0.1.0` - Estructura inicial del proyecto.
- `v0.2.0` - Gestión básica de usuarios y autenticación.
- `v0.3.0` - Módulo de despensa funcional.
- `v1.0.0` - Versión base del TFG entregable.

## Definición de tarea terminada
Para considerar que una tarea está realmente terminada, debería cumplirse lo siguiente:

- La funcionalidad implementada cumple su objetivo principal.
- El código mantiene coherencia con la estructura del proyecto.
- No quedan errores evidentes conocidos en esa parte.
- Se ha realizado al menos una comprobación manual.
- La tarea ha quedado registrada mediante commits claros y, si procede, issue cerrado.

## Buenas prácticas adicionales
Además de ramas, issues y commits, conviene mantener algunas normas sencillas de trabajo:

- Actualizar la documentación cuando cambie una funcionalidad importante.
- Mantener un `README.md` con la descripción del proyecto, stack tecnológico y forma de ejecución.
- Separar claramente frontend y backend en el repositorio si se desarrollan como módulos distintos.
- Usar nombres consistentes en carpetas, clases, componentes y endpoints.
- Evitar subir archivos innecesarios, temporales o credenciales al repositorio.

## Propuesta de flujo simple
El flujo recomendado para MyFoodie puede resumirse así:

1. Anotar la tarea como issue.
2. Crear rama desde `develop`.
3. Implementar la funcionalidad o corrección.
4. Hacer commits claros y pequeños.
5. Probar el cambio.
6. Fusionar en `develop`.
7. Pasar a `main` cuando exista una versión estable.