---
layout: post
lang: en
published: true
permalink: /en/security-maintainability-and-concurrency-control
commit_url:
date: 2026-01-19 16:18:13 +0900
link:
domain: security-maintainability-concurrency
title: Security, Maintainability, and Concurrency Control
description: ''
categories:
redirect_from:
  - /en/security-maintainability-and-concurrency-control
---

In this article, I share the refactoring process undertaken to elevate project quality to the next level. From encryption work to securely protect database access information, to modularization that eliminates duplicate frontend code, and methods for handling concurrency control in frequent data update situations.



## 1. Encrypting Sensitive Information with Jasypt



During development, sensitive information such as database URLs, usernames, and passwords are often exposed in plain text in the `application.yaml` file. This can be a major security vulnerability, which we resolved by introducing the **Jasypt (Java Simplified Encryption)** library.



The previously widely used `PBEWithMD5AndDES` algorithm does not have sufficient security strength by current standards. Therefore, we applied the **`PBEWITHHMACSHA512ANDAES_256`** algorithm to significantly enhance security. Additionally, we configured the encryption key (Master Key) to be injected via environment variables or VM options at runtime rather than placing it inside the source code, ensuring decryption is impossible even if the code is leaked.



To maintain this configuration in the test environment as well, we utilize `ReflectionTestUtils`. By reusing the `JasyptConfig` configuration in test code, we can guarantee encryption and decryption consistency.



## 2. View Modularization Using Thymeleaf Fragments



When developing the post list (`index.html`) and detail page (`viewer.html`), UI code that displays posts inevitably duplicates. Such duplication creates the inconvenience of having to modify multiple files when design changes occur and reduces maintainability. To resolve this, we modularized common parts using Thymeleaf's **Fragment** feature.



*   **`postitem.html`**: Post box component used in lists

*   **`postview.html`**: Body area component for detail pages

*   **`post/common.html`**: Common bottom area including like, retree (branching), share buttons, etc.



Not only UI but also JavaScript functions like `handleLike` were separated into external JS files. As a result, we achieved an efficient structure where modifying UI or logic in one place immediately reflects across all pages.



## 3. Resolving Concurrency Issues and Performance Optimization Using JPA



### 3.1. Concurrency Control Through Atomic Updates

Fields that are frequently updated, such as 'like' counts or 'branch' counts, are the most prone to concurrency issues. The approach of querying a value at the Java application level and saving it after adding 1 (`entity.setCount(count + 1)`) leads to data loss (Lost Update) when multiple requests come in simultaneously.



To solve this problem, we changed to execute `UPDATE` queries directly at the database level using JPA's **`@Modifying`** annotation.



```sql

UPDATE post SET like_count = like_count + 1 WHERE id = ?

```





This approach naturally utilizes the database's lock mechanism to guarantee data integrity. An important note is that after executing the update query, you must not call `postRepository.save(entity)`. There is a risk that the pre-change value remaining in the persistence context will overwrite the database's latest value.



### 3.2. Clear Query Generation Using Method Naming Conventions

For logic that queries child posts, we actively utilized `Property Traversal` among JPA's method naming conventions.



*   **`findAllByParentPost_Id`**: The underscore (`_`) plays a very important role. It clearly tells JPA to traverse the `parentPost` object inside the `Post` entity and use its `id` field as a condition. Through this, we can generate queries without ambiguity even in complex relationships where field names overlap.



### 3.3. Querying Only Necessary Columns (Projection)

Querying the entire entity when only one field like like count (`Long`) is needed is unnecessary resource waste. To optimize this, we changed to query only the necessary field using `@Query`.



```java

@Query("SELECT p.likeCount FROM Post p WHERE p.id = :id")

Long findLikeCountById(Long id);

```





JPA's basic methods like `findBy...` perform full entity queries, so when a specific type return value is needed, explicit query writing as above is essential.



---



Through this refactoring, we secured application security, improved maintenance efficiency by eliminating duplicate code, and most importantly, established a solid foundation where data can be accurately managed even in concurrent environments.
