---
layout: post
lang: en
published: true
permalink: /en/log-levels
commit_url:
date: 2026-01-19 11:06:05 +0900
link:
domain:
title: Log Levels
description: ''
categories:
redirect_from:
  - /en/log-levels
---

In software development and operations, logs serve as key indicators for understanding system status and diagnosing problems. Indiscriminate logging can cause system performance degradation and storage space shortages, while insufficient logging makes incident response difficult. The concept of log levels was introduced to manage this efficiently.



This article describes the definition of commonly used log levels and their situational usage.



---



### 1. Definition and Hierarchical Structure of Log Levels



Log levels are standards that classify stages according to event importance and detail. They have a hierarchical characteristic where lower levels include information from higher levels. The five commonly used levels are as follows.



#### TRACE (Most Detailed)

This is the stage that records the most granular information. It is used when fully investigating the program's execution path, such as method entry and exit, state changes inside loops, etc. Since the amount of data is enormous, it is rarely used in actual service production environments and is limitedly utilized when tracking extremely rare bugs in local development environments.



#### DEBUG

Used to verify system behavior during the development stage. It records intermediate calculation results of business logic or the state immediately before database query execution. It focuses on helping developers understand the internal flow of the system.



#### INFO (Standard Information)

This level indicates the normal operational state of the application. It records business-meaningful flows such as service start and stop, user authentication completion, and establishment of major transactions. It is also the stage adopted as the default setting in most frameworks.



#### WARN (Warning)

This means the application is currently running normally but contains potential problem elements. It is recorded when unexpected input values come in but can be processed with default values, or when resource usage approaches threshold values. It is a stage that requires continuous monitoring but not immediate action.



#### ERROR (Error)

A serious state where a runtime error has occurred and a specific request cannot be processed. This includes database connection failures, external API call impossibilities, unhandled Runtime Exceptions, etc. It means a situation that directly impacts system availability and should immediately notify administrators.



---



### 2. Filtering Principle Based on Level Settings



When setting logs, if you specify a specific level, only that level and logs with higher importance are output. For example, if you set the log level to INFO, the system records only INFO, WARN, and ERROR logs, excluding DEBUG and TRACE logs from output. This mechanism allows you to control the amount of logs by environment.



---



### 3. Recommended Log Levels by Environment



#### Development and Staging Environments

During the development process, DEBUG level is generally set as default since precise logic verification is needed. Only when problems occur in specific modules, temporarily activate TRACE level to identify the cause.



#### Production Environment

In production environments, it is recommended to maintain INFO level for performance optimization and readability. Unnecessary DEBUG logs cause disk I/O load and make it difficult to identify important error logs. However, during system stabilization periods, the level may be temporarily adjusted to collect detailed metrics.
