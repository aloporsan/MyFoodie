# MyFoodie

**MyFoodie** es una app móvil para gestionar la despensa de casa de forma inteligente: controla qué productos tienes, cuándo caducan, cuánto consumes y te ayuda a aprovechar mejor la comida antes de que se estropee. También incluye un apartado de recetas para aprovechar lo que ya tienes en casa.

Es un Trabajo de Fin de Grado (TFG) en desarrollo, por lo que algunas funcionalidades todavía están en construcción.

### ¿Qué puedes hacer con MyFoodie?

- 📦 **Despensa**: añadir, editar y organizar tus productos, con fechas de caducidad y alertas de stock mínimo.
- 📊 **Dashboard**: un resumen visual del estado de tu despensa y tu aprovechamiento alimentario.
- 🍳 **Recetas**: crear, guardar y consultar recetas relacionadas con lo que tienes disponible.
- 👤 **Perfil**: gestión de cuenta, preferencias y privacidad.

### Tecnología

El proyecto está dividido en dos partes:

- `backend`: API en Spring Boot (Java).
- `frontend`: app móvil hecha con Expo / React Native.

Las siguientes secciones son para desarrolladores que quieran ejecutar el proyecto en local.

## Requisitos

- Java 21.
- Node.js 18 o superior.
- npm.
- MongoDB ejecutandose en `localhost:27017`.
- Expo Go instalado en el movil si quieres probar en un dispositivo fisico.

## Estructura

- `backend/src/main/java/com/tfg/backend`: API Spring Boot.
- `backend/src/main/resources/application.properties`: configuracion del servidor y MongoDB.
- `frontend/app`: pantallas de Expo.
- `frontend/src/api/api.js`: cliente HTTP usado por la app.

## Backend

El backend expone el endpoint de comprobacion en `GET /api/health`.

### Ejecutar en desarrollo

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Ejecutar como JAR

```powershell
cd backend
.\mvnw.cmd package
java -jar target\backend-0.0.1-SNAPSHOT.jar
```

### Configuracion de MongoDB

El proyecto usa esta URI por defecto:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/myfood
```

Si MongoDB no esta levantado, el backend no arrancara correctamente.

### Poblar el feed con recetas de ejemplo (perfil `seed`)

Para que el feed social no aparezca vacio en cuanto arranca la app (por ejemplo
al probarla por primera vez o hacer una demo), existe un `CommandLineRunner`
que crea una cuenta oficial `myfoodie_oficial` con 20 recetas publicadas ya
listas para explorar. Solo se ejecuta con el perfil `seed` y es idempotente
(si la cuenta ya existe, no vuelve a insertar nada):

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=seed"
```

Las siguientes veces puedes arrancar el backend con el comando normal (sin el
perfil `seed`); los datos ya insertados se mantienen en MongoDB.

## Frontend

La app usa Expo y consulta el backend desde `frontend/src/api/api.js`.

### Instalar dependencias

```powershell
cd frontend
npm install
```

### Ejecutar Expo

```powershell
cd frontend
npm run start
```

Esto abre Metro / Expo DevTools y muestra un QR para abrir la app con Expo Go.

## Probar en movil

1. Arranca el backend.
2. Arranca Expo con `npm run start`.
3. Asegurate de que el movil y el PC estan en la misma red Wi-Fi.
4. Escanea el QR con Expo Go.
5. No pulses `a`: esa opcion intenta abrir un emulador Android en el PC.

La app intenta conectarse al backend usando la IP del host cuando es posible. Si necesitas forzar una URL concreta, define esta variable de entorno antes de iniciar Expo:

```powershell
set EXPO_PUBLIC_API_BASE_URL=http://192.168.1.35:8080/api
```

## Problemas comunes

- `adb` no se reconoce: no necesitas Android SDK para Expo Go en un movil fisico.
- Error al escanear el QR: revisa que PC y movil esten en la misma red y que el firewall permita el puerto 8080.
- `localhost` no funciona en el movil: usa la IP local del PC o la variable `EXPO_PUBLIC_API_BASE_URL`.

## Ejecucion completa resumida

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

```powershell
cd frontend
npm install
npm run start
```
