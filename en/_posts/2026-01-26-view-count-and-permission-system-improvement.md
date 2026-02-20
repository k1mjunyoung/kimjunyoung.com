---
layout: post
lang: en
published: true
permalink: /en/view-count-and-permission-system-improvement
commit_url:
date: 2026-01-26 16:47:39 +0900
link:
domain:
title: View Count and Permission System Improvement
description: ''
categories:
redirect_from:
  - /en/view-count-and-permission-system-improvement
---

The platform 'Muje' focusing on the essence of records has been analyzing user usage patterns since official launch and focusing on improving system stability and data reliability. Particularly in this update, we share the process of overhauling the 'view count' calculation method, which is the most basic indicator of users consuming posts, along with resolving technical debt that occurred during data synchronization between frontend and backend.



### 1. View Count Calculation Logic Overhaul for Metric Reliability



The existing method where numbers simply increased whenever pages loaded was vulnerable to refresh abuse and difficult to ensure data reliability. To solve this, we introduced cookie-based duplication prevention logic.



Server-side uses identification cookies to control so that view counts are not duplicated when revisiting specific posts within 1 hour in the same browser environment. Also, by designing to call view count increase API at the point when users click 'show more' in post list to actually consume body content, we could quantify actual post consumption experience rather than simple exposure.



### 2. Structural Resolution of Hibernate Lazy Loading Exception (LazyInitializationException)



During the process of adding view count increase logic, we faced technical challenges related to persistence context lifecycle. After bulk query `@Modifying` operation, the persistence context was initialized (`clear`), causing referenced entities to become detached state during subsequent DTO conversion, resulting in `LazyInitializationException`.



To solve this, we rearranged service layer work order and established a structure that can stably create DTOs regardless of persistence context state by immediately loading related user information and parent post information in one query. This not only prevented exceptions but also led to runtime performance optimization by fundamentally blocking N+1 problems.



### 3. Intuitive Count Unit Handling: Frontend Rendering Optimization



As service scale expanded, concerns about how to deliver large numbers to users also proceeded in parallel. To display view counts exceeding thousands readably, we implemented logic that dynamically formats raw data received from backend on frontend.



We chose to display 1,000 units as 'thousand' and 10,000 units as '10-thousand', rounding down to the first decimal place. In this process, we realized role separation where servers focus on pure data delivery and clients focus on visual optimization by embedding formatting methods inside JavaScript classes to reduce server computational burden.



### 4. Securing Permission Verification System Consistency and Enhancing Security



Security-wise, we unified ownership verification logic performed during post editing and deletion to be based on 'handle', the service's unique persona, instead of account identifier (email). This not only secures semantic consistency of domain model but also became the foundation for building a more robust authentication system intertwined with Spring Security's session management policy.



Also, we adjusted session maintenance time to match service characteristics and configured to destroy not only session identifier but also view count record cookies together during logout, ensuring user usage records are safely protected even in shared device environments.



### Conclusion



We believe that more important than adding features is that 'implemented features work accurately as intended'. Though this improvement work may not be eye-catching flashy changes, it was an important process that improves quality of data forming the service foundation and solidifies technical stability. Muje will continue to provide a reliable recording environment.
