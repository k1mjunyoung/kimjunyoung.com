---
layout: post
lang: en
published: true
permalink: /en/improving-frontend-maintainability-through-ui-component-integration
commit_url:
date: 2026-01-21 17:33:16 +0900
link:
domain: ui-component-integration
title: Improving Frontend Maintainability Through UI Component Integration
description: ''
categories:
redirect_from:
  - /en/improving-frontend-maintainability-through-ui-component-integration
---

As service scale grows, maintaining consistency of UI components exposed to users becomes an important challenge for developers. Particularly when post cards are repeatedly used across various pages like blogs or SNS, fragmented management logic can incur enormous costs even for minor design changes.



This article shares the process of integrating post rendering logic, which was divided between server-side rendering (SSR) and client-side rendering (CSR), into a single JavaScript class to maximize maintainability.



### Limitations of Fragmented Logic



In the existing system, we had been using two methods in parallel to display posts.



1.  **Server-Side Rendering**: Generated HTML using Thymeleaf fragments (`postitem.html`, `postview.html`) during initial page loading.

2.  **Client-Side Rendering**: Fetched data asynchronously for "load more" functionality or new post creation and generated HTML through string templates inside JavaScript.



This parallel structure caused the following clear problems.



*   **Duplicate code occurrence**: Whenever HTML structure changed, both Thymeleaf templates and JavaScript internal code had to be modified simultaneously.

*   **Complexity of event binding**: Interaction logic such as like processing or "load more" button behavior was scattered across multiple files (`like.js`, etc.), making flow difficult to understand.

*   **UI inconsistency**: If either logic was missed, post appearance or behavior would differ subtly across pages.



### Solution: Component-based Postcard Class



We undertook refactoring to introduce the `Postcard` class to manage HTML generation, data binding, and events for posts from a single point.



#### 1. Responsibility Integration Through Encapsulation



The class defined in `postcard.js` receives post data through the constructor and manages everything from generating HTML based on that data to initializing the markdown renderer (Toast UI Editor) and like processing logic.



As a result, the global function from `like.js` that existed as a separate file was internalized as the `Postcard.handleLike()` method, preventing global pollution and increasing cohesion.



#### 2. Template Unification



We changed the structure so that all pages call the `Postcard.createHTML()` method. Now whether it's the main feed or the comment area of the post detail page, the same class instance guarantees consistent UI.



### Refactoring Process and Achievements



Through this refactoring, extensive code cleanup was achieved throughout the project.



*   **Legacy code removal**: Deleted or marked as `Deprecated` Thymeleaf fragment files and duplicate like processing scripts that are no longer used, reducing project complexity.

*   **Declarative rendering**: In `index.html` and `viewer.html`, UI is now constructed through the clear command `card.render()` instead of complex HTML strings.

*   **State management optimization**: When like state changes, an interface was established to synchronize with external state through the `onLikeChange` callback, making data flow more transparent.



### Conclusion



Class-based component design, even in environments not using frontend frameworks, is a powerful tool that can dramatically improve code quality. Through this integration work, we escaped the inefficiency of "having to search through multiple files to modify one feature," and achieved the ability to control the lifecycle of the single component called post card from one place.



The process of resolving technical debt ultimately leads to faster feature deployment and stable service operation.
