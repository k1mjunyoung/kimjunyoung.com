---
layout: post
lang: en
published: true
permalink: /en/flexible-response-structure-design-and-profile-management-feature-implementation-for-improved-user-experience
commit_url:
date: 2026-01-27 17:45:36 +0900
link:
domain: profile-management-response
title: Flexible Response Structure Design and Profile Management Feature Implementation for Improved User Experience
description: ''
categories:
redirect_from:
  - /en/flexible-response-structure-design-and-profile-management-feature-implementation-for-improved-user-experience
---

To increase service scalability and maintainability, we improved the common response object and implemented profile image management functionality where users can directly express their identity. We share technical solutions encountered in this process.



# Common Response Object Generic Type Inference Improvement



The existing `ResponseDto` was created through Lombok's `@Builder`. However, due to the structure using generic types, when the builder is used without explicit type specification, the compiler cannot accurately infer types. To solve this, we introduced the static factory method pattern. By providing methods with clear names like `ResponseDto.ok()`, we improved readability and encapsulated types internally to prevent code duplication and mistakes on the user side.



# Profile Image Upload Implementation Considering Security



User profile image upload functionality is a point where client asynchronous requests and server security policies intertwine. Particularly to solve CSRF token omission problems occurring when calling REST APIs in Spring Security environments, we applied token delivery methods utilizing meta tags. Also, we stably store image data through integration with Cloudflare R2 storage, securing infrastructure management flexibility by separating profile settings by production environment.
