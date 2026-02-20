---
layout: post
lang: en
published: true
permalink: /en/logic-improvement-for-consistent-user-experience-and-data-integrity
commit_url:
date: 2026-01-26 12:03:59 +0900
link:
domain: logic-improvement-ux-integrity
title: Logic Improvement for Consistent User Experience and Data Integrity
description: ''
categories:
redirect_from:
  - /en/logic-improvement-for-consistent-user-experience-and-data-integrity
---

**Muje** aims to be a platform that respects users' diverse personas and preserves the value of records. As the service grows, existing fragmented logic increases maintenance complexity and sometimes causes results different from user intent. We would like to share the technical problems faced through recent updates and the structural improvements attempted to resolve them.



# 1. Resolving Form Binding Ambiguity and Securing UI/UX Consistency



The existing post editor provided different user experiences from the main page's quick compose tool. Particularly, the checkbox determining whether to write anonymously remained in simple form, not matching the service's overall visual language. To improve this, we changed the editor's anonymous setting to switch-type toggle UI and added clear text feedback of 'Anonymous' and 'Public'.



The part we focused on most technically during UI changes was data binding integrity. When using Thymeleaf's `th:field` attribute, Spring automatically generates a hidden field called `_isAnonymous` to prevent value omission when the checkbox is unchecked. At this time, a defect was discovered where boolean values were always interpreted as `true` because duplicate parameters were sent to the server due to overlap between manually defined `name` attribute and dynamic value changes by JavaScript.



To solve this, we utilized the top switch only as a UI component for status display, and unified actual data transmission through separate hidden fields controlled by JavaScript. As a result, we secured a stable structure where frontend state changes accurately map to backend DTO (Data Transfer Object).



# 2. Domain Identifier Consistency: From Email to Handle



In the process of verifying post edit and delete permissions, we had been utilizing user's email address as the main identifier. However, the persona uniquely representing users in the domain model is 'handle(@handle)'. Mixing the internal identifier email and external identifier handle in verification logic causes semantic inconsistency from a domain perspective and had high possibility of causing errors during URL routing or domain expansion in the future.



In this improvement work, we changed all ownership verification logic within the service to handle-based. By changing the structure to extract handle information from `UserPrincipal` at the controller layer and pass it to the service, we improved domain model consistency and redefined data access permission verification procedures more intuitively.



# 3. Robust Error Response Design Through API Common Exception Handling



Clear responses to exceptional situations in communication between client and server are directly connected to service reliability. We implemented `ApiGlobalExceptionHandler`, a global exception handler dedicated to `RestController`, utilizing `@ControllerAdvice`.



Particularly, we intercepted `MethodArgumentNotValidException` occurring through `@Valid` annotation to configure structured JSON format return by containing fields and error messages that failed validation checks in `LinkedHashMap`. Also, by applying consistent response specifications to runtime exceptions like `IllegalArgumentException`, we built a development environment where clients can immediately identify and respond to error causes.



# Conclusion



This work, though not flashy feature additions exposed externally, focused on improving accuracy of data processing that forms the service foundation and strengthening cohesion of internal logic. We expect that changes of one line of code will be delivered to users as better stability.
