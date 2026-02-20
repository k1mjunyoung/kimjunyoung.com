---
layout: post
lang: ko
published: true
permalink: /ko/spring-boot-프로파일을-활용한-환경별-설정-관리
commit_url:
date: 2026-01-21 16:39:19 +0900
link:
domain: spring-boot-profiles
title: Spring Boot 프로파일을 활용한 환경별 설정 관리
description: ''
categories: 
redirect_from:
  - /ko/spring-boot-프로파일을-활용한-환경별-설정-관리
---

## 개요



멀티 환경 애플리케이션을 개발할 때 가장 골치 아픈 문제 중 하나는 환경별 설정을 어떻게 관리할 것인가 하는 점입니다. 개발 환경, 스테이징, 운영 환경마다 데이터베이스 주소, 캐시 정책, 로깅 레벨 등이 모두 달라야 하기 때문입니다. 



이번 글에서는 Spring Boot의 프로파일(Profile) 기능을 활용하여 환경별 설정을 효율적으로 관리하는 방법을 소개하겠습니다.



## 문제 상황



일반적인 프로젝트에서 환경별 설정을 관리할 때 다음과 같은 문제가 발생합니다.



```yaml

# 기존의 문제: 같은 설정이 여러 파일에 중복됨

application-dev.yaml

├── datasource (개발용)

├── jpa.ddl-auto: update

├── r2 (모든 환경이 동일)

└── image (모든 환경이 동일)



application-railway.yaml

├── datasource (운영용)

├── jpa.ddl-auto: validate

├── r2 (모든 환경이 동일) ← 중복

└── image (모든 환경이 동일) ← 중복

```





이렇게 설정이 중복되면 나중에 `r2` 또는 `image` 설정을 변경해야 할 때 모든 파일을 수정해야 하므로 실수하기 쉽고 유지보수가 어려워집니다.



## 해결 방법: 프로파일 기반 설정 분리



Spring Boot의 프로파일 기능을 제대로 활용하면 공통 설정과 환경별 설정을 명확하게 분리할 수 있습니다.



### 1. 기본 설정 파일 (application.yaml)



모든 환경이 공통으로 사용하는 설정을 여기에 작성합니다.



```yaml

spring:

  application:

    name: blog



  # 기본 프로파일 지정

  profiles:

    active: local



  # 파일 업로드 용량 제한

  servlet:

    multipart:

      max-file-size: 10MB

      max-request-size: 10MB



  mvc:

    hiddenmethod:

      filter:

        enabled: true



  jpa:

    open-in-view: false



# 애플리케이션별 설정

blog:

  title: "Treeed"

  description: "작은 기록이 모여 나무가 되는 곳, 트리드"



# 모든 환경에서 동일한 R2 설정

r2:

  endpoint: ENC(...)

  public-url: ENC(...)

  access-key-id: ENC(...)

  secret-access-key: ENC(...)

  bucket: treead

  region: auto



# 모든 환경에서 동일한 이미지 설정

image:

  max-size: 10485760

  allowed-types: image/jpeg, image/jpg, image/png, image/webp, image/gif

```





이 파일의 핵심은 다음과 같습니다.



- **공통 설정만 포함**: 모든 환경이 동일하게 적용되어야 하는 설정들

- **기본 프로파일 지정**: `profiles.active: local`로 별도의 프로파일 지정이 없을 때 `local` 프로파일이 자동으로 활성화됨

- **중복 방지**: `r2`와 `image` 설정은 한 곳에만 정의



### 2. 로컬 개발 환경 설정 (application-local.yaml)



```yaml

spring:

  config:

    activate:

      on-profile: local



  datasource:

    url: jdbc:postgresql://localhost:5432/blog

    username: postgres

    password: postgres

    driver-class-name: org.postgresql.Driver



  jpa:

    hibernate:

      ddl-auto: update



  thymeleaf:

    cache: false

```





로컬 개발 환경의 특징을 반영합니다.



- **datasource**: 로컬 PostgreSQL 서버

- **ddl-auto**: `update`로 설정하여 스키마 자동 생성/변경

- **thymeleaf.cache**: `false`로 설정하여 템플릿 변경 시 즉시 반영



### 3. 운영 환경 설정 (application-railway.yaml)



```yaml

spring:

  config:

    activate:

      on-profile: railway



  datasource:

    url: jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}

    username: ${PGUSER}

    password: ${PGPASSWORD}

    driver-class-name: org.postgresql.Driver



  jpa:

    hibernate:

      ddl-auto: validate



  thymeleaf:

    cache: true



server:

  port: ${PORT:8080}

```





운영 환경의 안정성과 성능을 고려합니다.



- **datasource**: 환경 변수를 통한 동적 설정

- **ddl-auto**: `validate`로 설정하여 스키마 변경을 방지

- **thymeleaf.cache**: `true`로 설정하여 성능 최적화

- **server.port**: Railway에서 제공하는 포트 사용



## 설정 병합 메커니즘



Spring Boot는 다음과 같은 순서로 설정을 병합합니다.



```

1단계: application.yaml 로드

   ├─ spring.application.name = "blog"

   ├─ blog.title = "Treeed"

   ├─ r2 설정 (전체)

   └─ image 설정 (전체)



2단계: 활성 프로파일에 해당하는 파일 로드 및 오버라이드

   ├─ local 프로파일: application-local.yaml의 설정만 오버라이드

   │  └─ datasource, jpa.hibernate.ddl-auto, thymeleaf.cache

   │     (r2, image는 application.yaml의 값 유지)

   │

   └─ railway 프로파일: application-railway.yaml의 설정만 오버라이드

      └─ datasource, jpa.hibernate.ddl-auto, thymeleaf.cache, server.port

         (r2, image는 application.yaml의 값 유지)

```





이는 객체 지향의 상속 개념과 유사합니다. 기본 클래스에서 공통 기능을 정의하고, 자식 클래스에서 필요한 부분만 오버라이드하는 것처럼 설정도 동일하게 작동합니다.



## IDE 환경 설정



### IntelliJ IDEA에서 로컬 프로파일 활성화



Run Configuration에서 다음과 같이 설정합니다.



1. Run → Edit Configurations...

2. VM options에 추가:

```

-Dspring.profiles.active=local

```





또는 `application.yaml`에 `profiles.active: local`을 설정했다면 별도의 설정 없이도 자동으로 `local` 프로파일이 활성화됩니다.



### 명령줄에서 프로파일 지정



```shell script

# local 환경으로 실행

java -Dspring.profiles.active=local -jar blog.jar



# railway 환경으로 실행

java -Dspring.profiles.active=railway -jar blog.jar

```





## 실제 적용 효과



이렇게 설정을 분리함으로써 다음과 같은 이점을 얻을 수 있습니다.



### 1. 중복 제거



`r2`와 `image` 설정을 `application.yaml`에만 작성하므로, 나중에 R2 설정을 변경해야 할 때 한 곳에서만 수정하면 됩니다.



### 2. 유지보수 용이성 향상



새로운 환경(예: 스테이징)을 추가할 때 `application-staging.yaml` 파일만 만들면 되고, 기본 설정과 충돌할 염려가 없습니다.



### 3. 환경별 특성 명확화



각 파일을 보면 각 환경의 특성이 명확하게 드러납니다.



- `local`: 개발 편의성 중심 (ddl-auto: update, cache: false)

- `railway`: 안정성과 성능 중심 (ddl-auto: validate, cache: true)



### 4. 버전 관리 안전성



민감한 정보가 필요한 경우 환경 변수를 활용합니다. 예를 들어, Railway 환경에서는 `${PGUSER}`와 같은 환경 변수를 사용하므로 민감한 정보가 Git에 커밋되지 않습니다.



## 추가 고려사항



### 프로파일별 설정 파일이 많을 때



프로젝트가 성장하여 설정 파일이 많아지면 다음과 같이 구조화할 수 있습니다.



```

resources/

├── application.yaml

├── application-local.yaml

├── application-dev.yaml

├── application-staging.yaml

└── application-railway.yaml

```





각 프로파일마다 필요한 설정만 포함시키면, Spring Boot가 자동으로 기본 설정과 병합합니다.



### 프로파일별 로깅 설정



필요하다면 `logback-spring.xml`을 사용하여 프로파일별 로깅 레벨도 다르게 설정할 수 있습니다.



```xml

<springProfile name="local">

    <root level="DEBUG" />

</springProfile>



<springProfile name="railway">

    <root level="INFO" />

</springProfile>

```





## 결론



Spring Boot의 프로파일 기능은 멀티 환경 애플리케이션 개발에서 설정 관리의 복잡성을 크게 줄여줍니다. 특히 공통 설정과 환경별 설정을 명확하게 분리하면 코드의 가독성을 높이고 유지보수를 더 쉽게 할 수 있습니다.



이번 글에서 소개한 방식을 따르면 새로운 환경을 추가할 때도 기존 설정에 영향을 주지 않으면서 필요한 부분만 커스터마이징할 수 있으므로, 장기적으로 프로젝트 관리를 훨씬 수월하게 할 수 있습니다.