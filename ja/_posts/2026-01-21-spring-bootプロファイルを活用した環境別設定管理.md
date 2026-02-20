---
layout: post
lang: ja
published: true
permalink: /ja/spring-bootプロファイルを活用した環境別設定管理
commit_url:
date: 2026-01-21 16:39:19 +0900
link:
domain:
title: Spring Bootプロファイルを活用した環境別設定管理
description: ''
categories:
redirect_from:
  - /ja/spring-bootプロファイルを活用した環境別設定管理
---

## 概要



マルチ環境アプリケーションを開発する際、最も厄介な問題の一つは、環境別の設定をどのように管理するかという点です。開発環境、ステージング環境、本番環境ごとにデータベースアドレス、キャッシュポリシー、ログレベルなどがすべて異なる必要があるためです。



本記事では、Spring Bootのプロファイル(Profile)機能を活用して環境別設定を効率的に管理する方法を紹介します。



## 問題状況



一般的なプロジェクトで環境別設定を管理する際、以下のような問題が発生します。



```yaml

# 既存の問題: 同じ設定が複数のファイルに重複

application-dev.yaml

├── datasource (開発用)

├── jpa.ddl-auto: update

├── r2 (すべての環境で同じ)

└── image (すべての環境で同じ)



application-railway.yaml

├── datasource (本番用)

├── jpa.ddl-auto: validate

├── r2 (すべての環境で同じ) ← 重複

└── image (すべての環境で同じ) ← 重複

```





このように設定が重複すると、後で`r2`または`image`設定を変更する必要がある際にすべてのファイルを修正する必要があり、ミスしやすく保守が難しくなります。



## 解決方法: プロファイルベースの設定分離



Spring Bootのプロファイル機能を適切に活用すれば、共通設定と環境別設定を明確に分離できます。



### 1. 基本設定ファイル (application.yaml)



すべての環境が共通で使用する設定をここに記述します。



```yaml

spring:

  application:

    name: blog



  # デフォルトプロファイル指定

  profiles:

    active: local



  # ファイルアップロード容量制限

  servlet:

    multipart:

      max-file-size: 10MB

      max-request-size: 10MB



  mvc:

    hiddenmethod:

      filter:

        enabled: true



  jpa:

    open-in-view: false



# アプリケーション別設定

blog:

  title: "Treeed"

  description: "小さな記録が集まって木になる場所、トリード"



# すべての環境で同じR2設定

r2:

  endpoint: ENC(...)

  public-url: ENC(...)

  access-key-id: ENC(...)

  secret-access-key: ENC(...)

  bucket: treead

  region: auto



# すべての環境で同じ画像設定

image:

  max-size: 10485760

  allowed-types: image/jpeg, image/jpg, image/png, image/webp, image/gif

```





このファイルの核心は以下の通りです。



- **共通設定のみ含む**: すべての環境で同じように適用されるべき設定

- **デフォルトプロファイル指定**: `profiles.active: local`で別途プロファイル指定がない場合、`local`プロファイルが自動的に有効化

- **重複防止**: `r2`と`image`設定は一箇所にのみ定義



### 2. ローカル開発環境設定 (application-local.yaml)



```yaml

spring:

  config:

    activate:

      on-profile: local



  datasource:

    url: jdbc:postgresql://localhost:5432/blog

    username: postgres

    password: postgres

    driver-class-name: org.postgresql.Driver



  jpa:

    hibernate:

      ddl-auto: update



  thymeleaf:

    cache: false

```





ローカル開発環境の特徴を反映します。



- **datasource**: ローカルPostgreSQLサーバー

- **ddl-auto**: `update`に設定してスキーマ自動生成/変更

- **thymeleaf.cache**: `false`に設定してテンプレート変更時に即座に反映



### 3. 本番環境設定 (application-railway.yaml)



```yaml

spring:

  config:

    activate:

      on-profile: railway



  datasource:

    url: jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}

    username: ${PGUSER}

    password: ${PGPASSWORD}

    driver-class-name: org.postgresql.Driver



  jpa:

    hibernate:

      ddl-auto: validate



  thymeleaf:

    cache: true



server:

  port: ${PORT:8080}

```





本番環境の安定性とパフォーマンスを考慮します。



- **datasource**: 環境変数による動的設定

- **ddl-auto**: `validate`に設定してスキーマ変更を防止

- **thymeleaf.cache**: `true`に設定してパフォーマンス最適化

- **server.port**: Railwayが提供するポートを使用



## 設定マージメカニズム



Spring Bootは以下の順序で設定をマージします。



```

1段階: application.yamlをロード

   ├─ spring.application.name = "blog"

   ├─ blog.title = "Treeed"

   ├─ r2設定 (全体)

   └─ image設定 (全体)



2段階: 有効なプロファイルに該当するファイルをロードしてオーバーライド

   ├─ localプロファイル: application-local.yamlの設定のみオーバーライド

   │  └─ datasource, jpa.hibernate.ddl-auto, thymeleaf.cache

   │     (r2, imageはapplication.yamlの値を維持)

   │

   └─ railwayプロファイル: application-railway.yamlの設定のみオーバーライド

      └─ datasource, jpa.hibernate.ddl-auto, thymeleaf.cache, server.port

         (r2, imageはapplication.yamlの値を維持)

```





これはオブジェクト指向の継承概念に似ています。基本クラスで共通機能を定義し、子クラスで必要な部分のみをオーバーライドするように、設定も同じように動作します。



## IDE環境設定



### IntelliJ IDEAでローカルプロファイルを有効化



Run Configurationで以下のように設定します。



1. Run → Edit Configurations...

2. VM optionsに追加:

```

-Dspring.profiles.active=local

```





または`application.yaml`に`profiles.active: local`を設定していれば、別途設定なしでも自動的に`local`プロファイルが有効化されます。



### コマンドラインでプロファイルを指定



```shell script

# local環境で実行

java -Dspring.profiles.active=local -jar blog.jar



# railway環境で実行

java -Dspring.profiles.active=railway -jar blog.jar

```





## 実際の適用効果



このように設定を分離することで、以下の利点が得られます。



### 1. 重複排除



`r2`と`image`設定を`application.yaml`にのみ記述するため、後でR2設定を変更する必要がある際に一箇所で修正すれば済みます。



### 2. 保守性の向上



新しい環境(例: ステージング)を追加する際、`application-staging.yaml`ファイルを作成するだけでよく、基本設定と競合する心配がありません。



### 3. 環境別特性の明確化



各ファイルを見れば、各環境の特性が明確に現れます。



- `local`: 開発利便性中心 (ddl-auto: update, cache: false)

- `railway`: 安定性とパフォーマンス中心 (ddl-auto: validate, cache: true)



### 4. バージョン管理の安全性



機密情報が必要な場合は環境変数を活用します。例えば、Railway環境では`${PGUSER}`のような環境変数を使用するため、機密情報がGitにコミットされません。



## 追加考慮事項



### プロファイル別設定ファイルが多い場合



プロジェクトが成長して設定ファイルが多くなれば、以下のように構造化できます。



```

resources/

├── application.yaml

├── application-local.yaml

├── application-dev.yaml

├── application-staging.yaml

└── application-railway.yaml

```





各プロファイルごとに必要な設定のみ含めれば、Spring Bootが自動的に基本設定とマージします。



### プロファイル別ロギング設定



必要であれば`logback-spring.xml`を使用してプロファイル別のログレベルも異なるように設定できます。



```xml

<springProfile name="local">

    <root level="DEBUG" />

</springProfile>



<springProfile name="railway">

    <root level="INFO" />

</springProfile>

```





## 結論



Spring Bootのプロファイル機能は、マルチ環境アプリケーション開発において設定管理の複雑さを大幅に削減してくれます。特に共通設定と環境別設定を明確に分離すれば、コードの可読性を高め、保守をより簡単にすることができます。



本記事で紹介した方法に従えば、新しい環境を追加する際にも既存の設定に影響を与えることなく、必要な部分のみをカスタマイズできるため、長期的にプロジェクト管理をはるかに容易にすることができます。
