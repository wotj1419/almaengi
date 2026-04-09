FROM bellsoft/liberica-openjdk-alpine:17 AS build
WORKDIR /app

# 의존성 파일만 먼저 복사 → 캐시 활용
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew ./
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon || true

# 소스코드 복사 후 빌드
COPY . .
RUN chmod +x gradlew
RUN ./gradlew bootJar --no-daemon

FROM bellsoft/liberica-openjre-alpine:17
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8090
ENTRYPOINT ["java", "-jar", "app.jar"]