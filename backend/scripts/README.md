# Scripts de operación

## `reset-db.mongodb.js`

Borra **por completo** la base de datos indicada en la URI y deja lista una
siembra limpia. **Destructivo, sin confirmación.** Úsalo solo cuando quieras
partir de cero (Mongo local, o un cluster de Atlas reutilizado).

```
mongosh "<URI>" backend/scripts/reset-db.mongodb.js
```

Después, repuebla la cuenta oficial y sus recetas arrancando el backend con el
perfil `seed`:

```
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=seed
```

Para un cluster de Atlas nuevo no hace falta el reset: ya está vacío, basta con
el paso de `seed`.
