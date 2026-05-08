# 1단계: 빌드 (JDK 사용)
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar

# 2단계: 실행 (JRE + Alpine Linux 사용)
# - 용량이 작고 공격 표면(Attack Surface)이 좁아 보안에 유리합니다.
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 보안: Root 권한이 아닌 일반 유저로 실행
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
# AWS Secrets Manager에서 값을 가져오기 위한 환경 변수 공간 확보
ENTRYPOINT ["java", "-jar", "app.jar"]