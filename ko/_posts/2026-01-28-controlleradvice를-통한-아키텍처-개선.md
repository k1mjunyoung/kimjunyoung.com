---
layout: post
lang: ko
permalink: /ko/controlleradvice를-통한-아키텍처-개선
commit_url:
date: 2026-01-28 01:21:03 +0900
link:
domain:
title: @ControllerAdvice를 통한 아키텍처 개선
description: ''
categories: 
redirect_from:
  - /ko/controlleradvice를-통한-아키텍처-개선
---

각 컨트롤러 메서드마다 현재 로그인한 사용자의 정보를 조회하고 모델에 담는 로직은 코드의 중복을 발생시키고 유지보수성을 저하시킵니다. 또한 비로그인 사용자의 접근 시 발생할 수 있는 NullPointerException의 잠재적 원인이 되기도 합니다.

이를 해결하기 위해 `@ControllerAdvice`를 도입했습니다. 공통으로 필요한 사용자 정보(`userInfo`)와 좋아요 목록(`likeList`)을 전역 모델 속성으로 정의하여 모든 컨트롤러에서 개별적으로 관리하던 로직을 한 곳으로 집중시켰습니다.

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


이러한 리팩토링을 통해 컨트롤러는 각 페이지의 핵심 비즈니스 로직에만 집중할 수 있게 되었으며, 비로그인 상태에 대한 방어 로직을 중앙에서 관리함으로써 시스템의 안정성을 확보했습니다.