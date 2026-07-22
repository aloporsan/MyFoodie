# MyFoodie

Gestion Inteligente de Despensa

Proyecto dividido en dos partes:

- `backend`: API Spring Boot.
- `frontend`: app movil con Expo / React Native.

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

## Verificacion rapida

Cuando todo esta correcto, la pantalla principal muestra el mensaje devuelto por:

```http
GET /api/health
```

Respuesta esperada:

```json
{
	"status": "OK",
	"message": "Spring Boot backend running"
}
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
