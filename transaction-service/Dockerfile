FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY ../pom.xml ../pom.xml
RUN mvn dependency:go-offline -B 2>/dev/null || true
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S revpay && adduser -S revpay -G revpay
USER revpay
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p logs
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=docker", "app.jar"]
