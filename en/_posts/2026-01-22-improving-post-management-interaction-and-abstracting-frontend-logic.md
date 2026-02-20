---
layout: post
lang: en
published: true
permalink: /en/improving-post-management-interaction-and-abstracting-frontend-logic
commit_url:
date: 2026-01-22 17:45:23 +0900
link:
domain: post-management-frontend
title: Improving Post Management Interaction and Abstracting Frontend Logic
description: ''
categories:
redirect_from:
  - /en/improving-post-management-interaction-and-abstracting-frontend-logic
---

While developing the blog project ```Treeed```, we enhanced the post management function, which is the core of user experience (UX). We share the process of securing code maintainability through dynamic UI updates via asynchronous communication and externalizing common logic, departing from the existing page-unit rendering method.



#### 1. Integration and Abstraction of Post Rendering Logic



In the early implementation phase, similar JavaScript logic existed duplicated on the main feed page and post detail page. The process of creating and adding post cards (Postcard) to lists was fragmented, causing the inefficiency of having to change code in two places simultaneously when modifying features.



To solve this, we introduced `postmanager.js` to centralize global state and common functions. By managing login state, user identifier, and like list through the `window.blogState` object, we simplified so that each page only needs to declare its own data and configuration values.



Also, we generalized the asynchronous function `loadPosts` that loads post lists, designing so that the same logic can be reused in both main list and comment (retree) list by simply passing request path and container ID information.



#### 2. Dynamic CRUD Interaction Implementation Without Page Transitions



To minimize page refreshes that degrade user experience, we applied DOM manipulation-based update methods.



*   **Dynamic deletion**: Upon successful post deletion request, instead of server-side redirect, we received 200 OK response and immediately removed the corresponding card element in JavaScript. At this time, we added transparency animation for smooth transition to enhance deletion feedback.

*   **Immediate posting**: Newly registered posts through quick compose window are immediately converted to `Postcard` instances based on API response data and inserted at the top of the list. This process prevented unnecessary full list re-querying to reduce server load and increase perceived speed.



#### 3. Resolving Hibernate Lazy Loading Exception



During asynchronous API request processing, `org.hibernate.LazyInitializationException` occurred. This was because related user (`BlogUser`) and parent post (`Post`) information was in uninitialized proxy state at the point of converting to DTO immediately after post creation.



This problem occurs when attempting to access lazy-loaded fields at points beyond the persistence context scope. To solve this, rather than `getReferenceById` which only gets the entity's ID, we adopted the `findById` method that explicitly performs join queries at necessary points or loads actual entities, ensuring data integrity.



#### 4. UI/UX Detail Optimization: Separation of Feed and Detail View



In list-format feed view, we improved readability by limiting post length to a certain level and applying fade effects. However, in detail page (Viewer), all post content must be visible at a glance, so while using the same `Postcard` class, we conditionally disabled height limits and fade effects through the `showFullContent` option.



In CSS terms, we defined detail page-specific container classes and combined `!important` keyword with specific selectors to firmly neutralize existing `max-height` limits. Through this, we could effectively support views with different requirements using one component.



#### 5. Resolving Data Mapping Synchronization Issues



When implementing the like feature, there was a problem where values were not properly reflected in UI due to mismatch between server response object structure and client data reference path. We modified JavaScript logic by identifying the actual data location within the common response DTO `ResponseDto` returned by the server. Instead of simple class toggle method, we improved to maintain consistent state even in multi-device environments by synchronizing UI based on status messages (`liked`/`disliked`) sent by the server.



Through this work, we lowered coupling of frontend logic and clearly defined data flow between backend and client. We will continue to resolve technical debt proactively and build high-quality services.
