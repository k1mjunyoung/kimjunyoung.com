---
layout: post
lang: en
published: true
permalink: /en/search-feature-implementation-and-service-stabilization-journey-for-official-muje-deployment
commit_url:
date: 2026-01-23 17:02:32 +0900
link:
domain: search-feature-stabilization
title: Search Feature Implementation and Service Stabilization Journey for Official Muje Deployment
description: ''
categories:
redirect_from:
  - /en/search-feature-implementation-and-service-stabilization-journey-for-official-muje-deployment
---

The Muje project officially deployed its version today. We would like to share the technical challenges faced and the resolution process while improving service completeness utilizing Spring Boot-based technology stack.



## 1. Search System Design and Implementation as Core of User Experience



As information accumulated, the need for search functionality emerged for users to quickly find desired posts and authors. Muje's search system was designed to maximize user-centered convenience beyond simple keyword matching.



### Integration of Text Search and Handle Search



On the backend, we implemented keyword search covering title, description, and entire body through `PostRepository`. Particularly to accommodate search requests through 'handle' which is the user's ID, we applied branch logic in `PostService` that returns all posts of that user when `@` symbol is included at the query start. This helps users intuitively convey search intent to the system.



### Increased Readability Through Client-Side Highlighting



We implemented dynamic highlighting functionality to clearly recognize keyword positions within search results. To minimize server load, we adopted client-side rendering method utilizing DOM manipulation and regular expressions. We meticulously processed by traversing title and body nodes in result screens and marking text matching keywords, while selecting only text nodes to prevent HTML structure destruction.



## 2. Technical Defects and Structural Improvement of Mobile UI



While checking user interface (UI) in mobile environment before official deployment, serious malfunctions were discovered in Bootstrap modal system.



### Resolving Modal Backdrop and Focus Issues



When executing mobile search modal, a phenomenon occurred where the screen remained darkened, making operation impossible. Analysis revealed that the fixed property of bottom navigation bar caused conflicts with modal's layer hierarchy structure. To solve this, we separated the modal's DOM position from inside the navigation bar to an independent layer, maintaining logical grouping while removing technical interference by utilizing `th:block`.



### Dynamic Control of Post Fade Effect



We confirmed a problem where fade effect applied to process long bodies readably persisted even after body expansion, interfering with action button clicks. To solve this, we utilized CSS class control method to modify logic to disable fade layer in body expanded state, simultaneously securing visual completeness and functional integrity.



## 3. Safe Data Migration to Production Environment



The process of transferring quality data accumulated in development server to production server was important work requiring data integrity maintenance.



### Data Consistency Maintenance and Sequence Synchronization



Due to PostgreSQL's foreign key constraints, errors occurred during simple data insertion process. Also, when transferring data while preserving development server's unique IDs, conflicts were expected during new data insertion because the database's auto-increment sequence was not synchronized.



To solve this, we precisely migrated data after temporarily changing session replication roles or temporarily disabling constraints. After data insertion completion, we used `setval` function to match all table sequences to current data's maximum ID value, fundamentally blocking identifier collision possibilities that could occur during service operation.



We hope the numerous trial-and-error experiences and solutions encountered during deployment become useful reference materials for those with similar technical challenges.
