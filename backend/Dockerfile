# ---------- Etapa de build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copiamos primero el pom para reaprovechar la capa de dependencias mientras
# no cambie. Los rebuilds que solo tocan código fuente parten de esa capa.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline || true

COPY src ./src
# Los tests se ejecutan aparte en CI, no dentro de la imagen: maven.test.skip
# omite además la compilación de src/test (que el .dockerignore ya excluye).
RUN mvn -B clean package -Dmaven.test.skip=true

# ---------- Etapa de runtime ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Usuario sin privilegios para no correr como root dentro del contenedor.
RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=build /build/target/*.jar app.jar
COPY entrypoint.sh entrypoint.sh
RUN chmod 0755 entrypoint.sh

USER spring:spring

# Railway inyecta PORT en tiempo de ejecución; el app.properties lo lee como ${PORT:8080}.
EXPOSE 8080

# entrypoint.sh materializa GOOGLE_CREDENTIALS_JSON a fichero (OCR) y arranca el jar.
ENTRYPOINT ["./entrypoint.sh"]
