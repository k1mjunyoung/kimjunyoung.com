---
layout: post
lang: en
published: true
permalink: /en/deploying-with-railway-and-implementing-like-feature-with-concurrency-control
commit_url:
date: 2026-01-19 13:13:12 +0900
link:
domain:
title: Deploying with Railway and Implementing Like Feature with Concurrency Control
description: ''
categories:
redirect_from:
  - /en/deploying-with-railway-and-implementing-like-feature-with-concurrency-control
---

## 1. Deploying Spring Boot Application and Resolving Database Connection Errors



In the early stages of the project, we selected the Railway platform for deployment convenience. We built an automated deployment system based on Dockerfile, but encountered a `JDBCConnectionException` during the execution phase. The main cause of this error was a format mismatch in the database connection string.



Railway's `DATABASE_URL` follows the standard PostgreSQL format, but Spring Boot's JDBC driver requires an address with an explicit driver identifier. To resolve this, rather than relying on a single URL variable, we combined the individual environment variables provided by Railway (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) and configured them in `application.yml`. This approach not only improves configuration clarity but also allows for more flexible adaptation to environmental changes.



We also confirmed the impact of server physical location on response speed. For services targeting Korean users, deploying servers and databases in the Singapore region rather than the United States significantly reduced network latency. The key to performance optimization is to place both the server and database in the same region to utilize internal network communication.



---



## 2. Database Design for Efficient "Like" Feature Implementation



The post like feature requires data integrity beyond simple counting. Simply having a count column in the post table cannot identify who pressed like and makes it difficult to control duplicate requests. Therefore, we introduced a separate `PostLike` entity to resolve the many-to-many relationship between 'users' and 'posts'.



We paid careful attention to entity naming. To prevent conflicts with the SQL reserved word `LIKE`, we used the name `PostLike`, and added a unique constraint to the combination of `userId` and `postId` to fundamentally block data duplication. Additionally, we added an index to the `userId` column to improve performance when querying the list of likes pressed by a specific user.



For the identifier strategy, we chose a surrogate key strategy using auto-generated primary keys (Long ID) instead of composite keys. This reduces JPA implementation complexity and allows flexible adaptation to future requirement changes. When configuring entity relationships, we applied lazy loading (`FetchType.LAZY`) as the default for performance optimization.



---



## 3. Concurrency Control and JPA Persistence Management



As the service scales, we needed to consider concurrency issues, namely the "Lost Update" problem that occurs when multiple users press like simultaneously. Simply reading a value at the Java application level, incrementing it, and saving it again does not guarantee data consistency.



To solve this, we utilized database atomic operations. With JPA's `@Modifying` annotation, we wrote JPQL like `UPDATE Post p SET p.likeCount = p.likeCount + 1` to have the database directly perform the operation. This approach ensures accurate counts even when multiple requests come in simultaneously through row-level locking.



An important consideration here is JPA's persistence context management. Bulk update queries are directly reflected in the database without going through the persistence context, which can cause inconsistency between the entity state in memory and the actual database state. To prevent this, we used the `@Modifying(clearAutomatically = true)` option to initialize the persistence context immediately after query execution, ensuring the latest data is retrieved in subsequent queries.



---



## 4. Infrastructure Cost Analysis and Optimization Strategy



As development progressed and we separated production and development environments, infrastructure costs needed review. Railway's hobby plan provides $5 in monthly credits, but running two resource-intensive Spring Boot servers and a PostgreSQL database 24/7 resulted in estimated monthly costs of approximately $18 to $23.



For cost efficiency, we first introduced a method of creating and sharing separate production (`prod`) and development (`dev`) databases within a single PostgreSQL instance. This reduces the fixed costs incurred by creating additional database services.



Furthermore, we considered migrating to AWS Lightsail with a fixed cost model. The $5 monthly Lightsail plan provides 1GB of RAM, which is sufficient to run production server, development server, and database simultaneously using Docker. Although the initial setup and CI/CD construction process through GitHub Actions may be more complex compared to Railway, we confirmed that Lightsail is a more reasonable choice considering long-term operational costs and the learning value of building CI/CD experience.



---



## 5. Conclusion and Future Plans



Through this project, we gained in-depth understanding of the overall service mechanism beyond simple feature implementation, including network latency issues in deployment environments, logical and physical database design, transactions and concurrency control, and infrastructure cost management. Particularly valuable was understanding the interaction between the database and persistence context that occurs behind the abstracted framework.



In the future, we plan to migrate infrastructure to AWS Lightsail and build a stable deployment automation pipeline combining GitHub Actions and Docker Compose. Additionally, we plan to further enhance performance by introducing caching strategies for key features that may experience traffic spikes beyond the like feature.
