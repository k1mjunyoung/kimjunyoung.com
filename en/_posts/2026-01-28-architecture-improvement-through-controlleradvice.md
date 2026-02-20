---
layout: post
lang: en
published: true
permalink: /en/architecture-improvement-through-controlleradvice
commit_url:
date: 2026-01-28 01:21:03 +0900
link:
domain:
title: Architecture Improvement Through @ControllerAdvice
description: ''
categories:
redirect_from:
  - /en/architecture-improvement-through-controlleradvice
---

Logic that queries currently logged-in user information and puts it in the model for each controller method causes code duplication and reduces maintainability. It also becomes a potential cause of NullPointerException that can occur when non-logged-in users access.



To solve this, we introduced `@ControllerAdvice`. By defining commonly needed user information (`userInfo`) and like list (`likeList`) as global model attributes, we concentrated logic that each controller individually managed into one place.



```java

@ControllerAdvice

public class GlobalControllerAdvice {

    @ModelAttribute("likeList")

    public List<Long> addLikeList(@AuthenticationPrincipal UserPrincipal userPrincipal) {

        if (userPrincipal == null) return new ArrayList<>();

        return postLikeService.getLikeList(userPrincipal.getUser().getId());

    }

}

```





Through this refactoring, controllers became able to focus only on each page's core business logic, and we secured system stability by centrally managing defensive logic for non-logged-in states.
