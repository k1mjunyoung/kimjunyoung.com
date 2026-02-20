---
layout: post
lang: ja
published: true
permalink: /ja/thymeleafレイアウトを利用したui改編記
commit_url:
date: 2026-01-21 16:41:29 +0900
link:
domain: thymeleaf-layout-redesign
title: Thymeleafレイアウトを利用したUI改編記
description: ''
categories:
redirect_from:
  - /ja/thymeleafレイアウトを利用したui改編記
---

## はじめに



「Bootstrapで難しい部分だけカスタムCSSを書いてほしい」というリクエストから始まったプロジェクトでした。既存のレガシーUIを現代的なSNSスタイルに完全にリニューアルしながら経験したことと解決策を共有したいと思います。



## 問題状況



既存のブログは伝統的なWebブログレイアウトに従っていました。しかし、ユーザー体験を改善し、より現代的なインターフェースを提供するために、TwitterのようなSNSフィード形式への転換が必要でした。特にバックエンド開発者の立場でUIを直接構成するためには、以下のような悩みがありました。



- 保守しやすい構造

- 重複を最小化したコード再利用性

- 一貫したデザインシステムの適用

- モバイルレスポンシブ対応



## 技術選択: Thymeleafレイアウトパターン



まず適用した技術は、Thymeleafのレイアウト Dialectを活用した階層的テンプレート構造です。



```textmate

implementation 'nz.net.ultraq.thymeleaf:thymeleaf-layout-dialect:3.3.0'

```





### レイアウト階層構造



```

layouts/default.html (基本レイアウト)

├── fragments/components.html (再利用可能なすべてのコンポーネント)

│   ├── navbar

│   ├── sidebar-left

│   ├── sidebar-right

│   ├── post-card

│   └── mobile-nav

└── 各ページ (index.html, viewer.html など)

```





この構造により、すべてのページで一貫したヘッダー、サイドバー、フッターを自動的に適用できました。新しいページを追加する際は、単に`layout:decorate="~{layouts/default}"`を宣言し、`layout:fragment="content"`にのみ集中すればよいのです。



## デザインシステムの構築



### ブランド一貫性の維持



すべての色、サイズ、スタイルをCSS変数とユーティリティクラスで定義しました。



```css

/* ブランドカラー */

.brand-color {

    color: #4A7822;

}



.post-action-btn {

    text-decoration: none !important;

    border-radius: 50px;

    padding: 6px 12px !important;

    transition: all 0.2s ease;

}



.post-action-btn:hover {

    background-color: rgba(74, 120, 34, 0.1);

    color: #4A7822 !important;

}

```





Bootstrapの基本スタイルを最大限活用しながら、プロジェクト固有のデザインが必要な部分だけカスタムCSSを作成しました。これによりCSSファイルのサイズを最小化しながらも、ブランドの一貫性を維持できました。



## 主要実装事項



### 1. レスポンシブレイアウト



Bootstrapのグリッドシステムを活用しつつ、モバイルでの使いやすさを特に考慮しました。



```html

<div class="container-fluid main-container">

    <div class="row justify-content-center">

        <!-- 左サイドバー: デスクトップのみ表示 -->

        <aside class="col-lg-2 d-none d-lg-block sidebar-left">

            ...

        </aside>



        <!-- メインコンテンツ -->

        <main class="col-12 col-lg-6 main-content px-0">

            ...

        </main>



        <!-- 右サイドバー: デスクトップのみ表示 -->

        <aside class="col-lg-3 d-none d-lg-block sidebar-right">

            ...

        </aside>

    </div>

</div>



<!-- モバイル下部ナビゲーション: 画面サイズ992px以下のみ表示 -->

<nav class="d-lg-none mobile-nav">

    ...

</nav>

```





デスクトップでは3カラムレイアウトで情報を豊富に提供し、モバイルではメインコンテンツに集中できるよう設計しました。特に下部ナビゲーションを固定し、モバイルユーザーが常にアクセスできるようにしました。



### 2. 投稿の長さ制御と「もっと見る」機能



ユーザーがフィードで長い投稿による不便を経験しないよう、300px以上の投稿は自動的にフェード効果とともに「もっと見る」ボタンを表示します。



```javascript

function checkHeightAndFade(viewerEl) {

    const wrapper = viewerEl.closest('.post-content-wrapper');

    const maxHeight = 300;



    if (viewerEl.offsetHeight > maxHeight) {

        wrapper.classList.add('has-fade');

        const showMoreBtn = wrapper.parentElement.querySelector('.show-more-btn');

        if (showMoreBtn) showMoreBtn.classList.remove('d-none');

    }

}



function togglePostContent(btn) {

    const wrapper = document.querySelector(btn.getAttribute('data-target'));

    if (wrapper.classList.contains('expanded')) {

        wrapper.classList.remove('expanded');

        btn.textContent = 'もっと見る';

    } else {

        wrapper.classList.add('expanded');

        btn.textContent = '閉じる';

    }

}

```





CSSで`max-height`プロパティとグラデーションを活用したフェード効果で、スムーズなユーザー体験を提供しました。



### 3. エディタ画面の最適化



最初はエディタがスクロールされる時もあり、ページ自体がスクロールされる時もある一貫性のない動作がありました。これを解決するため、Flexboxを活用した完全なレイアウト再設計を行いました。



```css

html, body {

    height: 100%;

    margin: 0;

    padding: 0;

    overflow: hidden;

}



#postForm {

    display: flex;

    flex-direction: column;

    height: 100vh;

    overflow: hidden;

}



.editor-body {

    flex: 1;

    display: flex;

    flex-direction: column;

    overflow: hidden;

}



#editor {

    flex: 1;

    overflow: hidden !important;

}

```





これにより、ページ全体のスクロールを削除し、エディタ内部でのみスクロールが発生するよう制限しました。その結果、ユーザーは常にヘッダーとタイトル入力欄を見ることができ、エディタにのみ集中できる環境を構築しました。



## 学んだこと



### 1. フロントエンドはバックエンドの責任ではないが



バックエンド開発者がUIを構成する際は、フレームワークとライブラリの基本機能を最大限活用することが重要です。BootstrapやThymeleafのようなツールは、すでに検証されたパターンを提供しているため、これを正しく活用すれば思ったより効率的な結果を得ることができます。



### 2. モジュール化と再利用性



Thymeleafのフラグメントを活用したコンポーネントベース開発は、テンプレートでも同じように適用されます。各コンポーネントを独立的に維持すれば、後でスタイル変更や機能追加時に影響範囲を最小化できます。



### 3. レスポンシブデザインの重要性



モバイルユーザーの割合が高まるにつれ、レスポンシブデザインは選択ではなく必須です。特にSNS形式のフィードは、モバイルでより自然なユーザー体験を提供する必要があります。



## おわりに



このプロジェクトを通じて、バックエンド開発者も基本的なUI/UX原則を理解し、適切なツールを活用すれば専門家レベルのフロントエンドを構成できることを学びました。もちろん、専門フロントエンド開発者の感覚を完全に代替することはできませんが、小規模チームや個人プロジェクトでは十分可能な領域です。



特にThymeleafレイアウトパターンとBootstrapの組み合わせは、思ったより強力なツールです。これを活用すれば、速く一貫性のあるWebインターフェースを構成でき、後の保守もはるかに容易になります。
