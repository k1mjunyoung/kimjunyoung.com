---
layout: post
lang: ja
published: true
permalink: /ja/controlleradviceによるアーキテクチャ改善
commit_url:
date: 2026-01-28 01:21:03 +0900
link:
domain:
title: "@ControllerAdviceによるアーキテクチャ改善"
description: ''
categories:
redirect_from:
  - /ja/controlleradviceによるアーキテクチャ改善
---

各コントローラメソッドごとに現在ログインしているユーザーの情報を照会してモデルに入れるロジックは、コードの重複を発生させ、保守性を低下させます。また、非ログインユーザーのアクセス時に発生する可能性があるNullPointerExceptionの潜在的な原因にもなります。



これを解決するために`@ControllerAdvice`を導入しました。共通で必要なユーザー情報(`userInfo`)といいねリスト(`likeList`)をグローバルモデル属性として定義し、すべてのコントローラで個別に管理していたロジックを1箇所に集中させました。



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





このようなリファクタリングにより、コントローラは各ページの核心ビジネスロジックにのみ集中できるようになり、非ログイン状態に対する防御ロジックを中央で管理することでシステムの安定性を確保しました。
