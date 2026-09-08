// Reset de la base de datos de MyFoodie.
//
// DESTRUCTIVO: borra por completo la base de datos apuntada por la URI.
// No se ejecuta solo: hay que lanzarlo a mano con mongosh.
//
//   mongosh "<URI>" backend/scripts/reset-db.mongodb.js
//
// Ejemplos de URI:
//   local  -> "mongodb://localhost:27017/myfoodie"
//   Atlas  -> "mongodb+srv://usuario:pass@cluster.mongodb.net/myfoodie"
//
// Despues de este script, arranca el backend con el perfil "seed" para volver a
// crear la cuenta oficial (@myfoodie_oficial) y sus recetas:
//
//   cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=seed
//
// Los indices se recrean solos al arrancar (spring.data.mongodb.auto-index-creation=true).

const nombre = db.getName();
const colecciones = db.getCollectionNames();

print(`Base de datos: ${nombre}`);
print(`Colecciones antes: ${colecciones.length ? colecciones.join(", ") : "(vacia)"}`);

const resultado = db.dropDatabase();
print(`dropDatabase(): ${JSON.stringify(resultado)}`);
print(`Base '${nombre}' eliminada. Siguiente paso: arrancar el backend con el perfil 'seed'.`);
