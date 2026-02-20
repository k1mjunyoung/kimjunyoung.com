---
layout: post
lang: en
published: true
permalink: /en/environment-specific-configuration-management-with-spring-boot-profiles
commit_url:
date: 2026-01-21 16:39:19 +0900
link:
domain: spring-boot-profiles
title: Environment-Specific Configuration Management with Spring Boot Profiles
description: ''
categories:
redirect_from:
  - /en/environment-specific-configuration-management-with-spring-boot-profiles
---

## Overview



One of the most troublesome problems when developing multi-environment applications is how to manage environment-specific configurations. Database addresses, cache policies, logging levels, etc., must all differ for development, staging, and production environments.



In this article, I will introduce how to efficiently manage environment-specific configurations using Spring Boot's Profile feature.



## Problem Situation



When managing environment-specific configurations in typical projects, the following problems occur.



```yaml

# Existing problem: Same configuration duplicated in multiple files

application-dev.yaml

├── datasource (development)

├── jpa.ddl-auto: update

├── r2 (same for all environments)

└── image (same for all environments)



application-railway.yaml

├── datasource (production)

├── jpa.ddl-auto: validate

├── r2 (same for all environments) ← Duplicate

└── image (same for all environments) ← Duplicate

```





When configurations are duplicated this way, you need to modify all files when changing `r2` or `image` settings later, making it error-prone and difficult to maintain.



## Solution: Profile-Based Configuration Separation



Properly utilizing Spring Boot's profile feature allows clear separation of common and environment-specific configurations.



### 1. Base Configuration File (application.yaml)



Write configurations that all environments use in common here.



```yaml

spring:

  application:

    name: blog



  # Specify default profile

  profiles:

    active: local



  # File upload size limit

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



# Application-specific settings

blog:

  title: "Treeed"

  description: "A place where small records gather to become trees, Treeed"



# R2 configuration same for all environments

r2:

  endpoint: ENC(...)

  public-url: ENC(...)

  access-key-id: ENC(...)

  secret-access-key: ENC(...)

  bucket: treead

  region: auto



# Image configuration same for all environments

image:

  max-size: 10485760

  allowed-types: image/jpeg, image/jpg, image/png, image/webp, image/gif

```





The key points of this file are:



- **Contains only common settings**: Configurations that should be applied identically to all environments

- **Specifies default profile**: `profiles.active: local` automatically activates the `local` profile when no separate profile is specified

- **Prevents duplication**: `r2` and `image` settings defined in only one place



### 2. Local Development Environment Configuration (application-local.yaml)



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





Reflects characteristics of local development environment.



- **datasource**: Local PostgreSQL server

- **ddl-auto**: Set to `update` for automatic schema creation/modification

- **thymeleaf.cache**: Set to `false` for immediate reflection of template changes



### 3. Production Environment Configuration (application-railway.yaml)



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





Considers stability and performance of production environment.



- **datasource**: Dynamic configuration through environment variables

- **ddl-auto**: Set to `validate` to prevent schema changes

- **thymeleaf.cache**: Set to `true` for performance optimization

- **server.port**: Uses port provided by Railway



## Configuration Merging Mechanism



Spring Boot merges configurations in the following order:



```

Step 1: Load application.yaml

   ├─ spring.application.name = "blog"

   ├─ blog.title = "Treeed"

   ├─ r2 configuration (all)

   └─ image configuration (all)



Step 2: Load and override file corresponding to active profile

   ├─ local profile: Override only application-local.yaml settings

   │  └─ datasource, jpa.hibernate.ddl-auto, thymeleaf.cache

   │     (r2, image maintain application.yaml values)

   │

   └─ railway profile: Override only application-railway.yaml settings

      └─ datasource, jpa.hibernate.ddl-auto, thymeleaf.cache, server.port

         (r2, image maintain application.yaml values)

```





This is similar to the inheritance concept in object-oriented programming. Just as common functions are defined in the base class and only necessary parts are overridden in child classes, configurations work the same way.



## IDE Environment Settings



### Activating Local Profile in IntelliJ IDEA



Configure as follows in Run Configuration.



1. Run → Edit Configurations...

2. Add to VM options:

```

-Dspring.profiles.active=local

```





Or if you set `profiles.active: local` in `application.yaml`, the `local` profile will automatically activate without separate configuration.



### Specifying Profile from Command Line



```shell script

# Run in local environment

java -Dspring.profiles.active=local -jar blog.jar



# Run in railway environment

java -Dspring.profiles.active=railway -jar blog.jar

```





## Practical Application Benefits



By separating configurations this way, you can gain the following advantages.



### 1. Duplication Removal



Since `r2` and `image` configurations are written only in `application.yaml`, you only need to modify in one place when changing R2 settings later.



### 2. Improved Maintainability



When adding a new environment (e.g., staging), you only need to create `application-staging.yaml` file without worrying about conflicts with base configuration.



### 3. Clarified Environment-Specific Characteristics



Each file clearly reveals the characteristics of each environment.



- `local`: Development convenience-focused (ddl-auto: update, cache: false)

- `railway`: Stability and performance-focused (ddl-auto: validate, cache: true)



### 4. Version Control Safety



Utilize environment variables when sensitive information is needed. For example, in Railway environment, since environment variables like `${PGUSER}` are used, sensitive information is not committed to Git.



## Additional Considerations



### When There Are Many Profile-Specific Configuration Files



If the project grows and configuration files multiply, you can structure as follows.



```

resources/

├── application.yaml

├── application-local.yaml

├── application-dev.yaml

├── application-staging.yaml

└── application-railway.yaml

```





Including only necessary configurations for each profile, Spring Boot automatically merges with base configuration.



### Profile-Specific Logging Configuration



If needed, you can set different logging levels per profile using `logback-spring.xml`.



```xml

<springProfile name="local">

    <root level="DEBUG" />

</springProfile>



<springProfile name="railway">

    <root level="INFO" />

</springProfile>

```





## Conclusion



Spring Boot's profile feature greatly reduces the complexity of configuration management in multi-environment application development. Particularly, clearly separating common and environment-specific configurations improves code readability and makes maintenance easier.



Following the approach introduced in this article, you can customize only necessary parts without affecting existing configurations when adding new environments, making long-term project management much easier.
