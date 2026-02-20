---
layout: post
lang: en
published: true
permalink: /en/out-of-memory-resolution
commit_url:
date: 2026-01-22 10:05:25 +0900
link:
domain: out-of-memory-resolution
title: Out Of Memory Resolution
description: ''
categories:
redirect_from:
  - /en/out-of-memory-resolution
---

## Ensuring Stability of Spring Boot Service in Low-Spec Container Environments



While cloud environment development has made service deployment easy, maintaining application stability within limited resources remains an important challenge for engineers. Particularly, the approximately 1GB memory provided in PaaS environment free tiers like Railway is somewhat challenging for running Spring Boot applications.



This post shares the process of diagnosing OutOfMemory (OOM) problems that occurred in a 1GB memory environment and the JVM tuning, connection pool optimization, and batch process improvements undertaken to resolve them.



---



### 1. Problem Recognition and Cause Analysis



In the initial setup, the application showed intermittent forced process termination. The cause was OOM Kill that occurred from exceeding the container's allowed memory threshold. The main causes were summarized as follows in three points.



1. **Excessively high Heap memory occupancy rate**: The existing configuration allocated 75% of total memory to the Heap area. This was a setting that did not consider JVM's Non-Heap areas such as Metaspace, Stack, Code Cache, and OS minimum operating memory.

2. **Excessive resource usage during build phase**: During Docker build, Gradle daemon operated in the background, occupying considerable memory.

3. **Memory load from batch jobs**: Batch jobs processing orphaned data accumulated in the DB were querying data all at once in `List` form, instantly depleting Heap memory.



---



### 2. Infrastructure Optimization: JVM and Docker Configuration



First, we proceeded with tuning to secure memory availability at the infrastructure level.



#### JVM Parameter Readjustment

We lowered the Heap memory proportion to 50% to balance with Non-Heap areas. Also, considering that memory saving takes priority over performance optimization in this environment, we adjusted the Tiered Compilation level.



* **MaxRAMPercentage=50.0**: Allocated about 500MB to Heap in 1GB environment and secured the rest as spare space.

* **TieredStopAtLevel=1**: Reduced compile-time memory load and improved startup speed by limiting C2 compiler.

* **MaxMetaspaceSize and ReservedCodeCacheSize**: Set upper limits on areas that can grow indefinitely to prevent unpredictable memory expansion.



#### Build Process Improvement

We explicitly specified Gradle in-memory arguments in the build phase of the Dockerfile to control memory overhead occurring during build. Improved build environment stability through `org.gradle.jvmargs="-Xmx512m"` setting.



---



### 3. Resource Management Optimization: Connection Pool Diet



DB connections are resources that occupy memory themselves. In early service environments where traffic is not concentrated, the default value of 10 connections in the connection pool may feel unnecessary.



Accordingly, we optimized HikariCP settings as follows.

* **Reduced maximum-pool-size to 5**: Limited number of connections to reduce memory footprint occupied by related objects.

* **Shortened idle-timeout**: Induced faster recovery of unused connections to return resources to the system.



---



### 4. Application Optimization: Batch Process Paging and Soft Delete Introduction



The most noticeable improvement came from modifying the batch job (`R2ImageBatch`) logic. The existing method had a structural flaw of loading deletion target data into memory all at once.



#### Paging Processing Using Slice

We processed data in appropriate units (BATCH_SIZE = 50) using Spring Data JPA's `Slice` instead of `List`. `Slice` has a performance advantage over `Page` when processing large amounts of data because it omits the `Count` query that counts total data. Through this, Heap memory maintains a constant level even when tens of thousands of data accumulate.



#### Soft Delete and State Management

We transitioned from the existing hard delete method to soft delete method.

* **Data consistency**: While deleting actual files in external storage (R2), we recorded timestamps in the `deletedAt` field in DB records to manage data history.

* **Query optimization**: Removed the cost of redundantly reading already processed data by adding `deletedAt IS NULL` condition during batch jobs.



---



### 5. Conclusion and Achievements



After undergoing this series of optimization processes, OOM phenomena no longer occurred in the Railway environment. We reconfirmed that in extremely resource-limited environments, rather than simply considering scale-up to high-spec servers, analyzing application resource usage patterns in detail and optimizing from JVM level to code level must precede.



This improvement work not only secured service stability but also became an opportunity to internalize efficient resource management methods throughout the team. We hope this case helps engineers experiencing similar problems in similar environments.
