---
layout: post
lang: ja
published: true
permalink: /ja/cloudflare-r2を活用した画像アップロードと自動整理システムの構築
commit_url:
date: 2026-01-20 17:44:07 +0900
link:
domain:
title: Cloudflare R2を活用した画像アップロードと自動整理システムの構築
description: ''
categories:
redirect_from:
  - /ja/cloudflare-r2を活用した画像アップロードと自動整理システムの構築
---

## はじめに



Webアプリケーションにおいて画像アップロード機能は必須ですが、管理しなければ未使用のファイルがストレージに蓄積されてコストと管理負担が増加します。特にユーザーが画像をアップロードした後、投稿作成をキャンセルしたり、投稿を削除したりする際に、関連する画像をどう処理するかは重要な課題です。



本記事では、Spring Bootベースのブログプロジェクトにおいて、Toast UI Editorを通じた画像アップロードからCloudflare R2ストレージへの保存、そしてバッチ作業による自動整理までの全プロセスを紹介します。



---



## 課題の定義



画像アップロード機能を実装する際、以下の問題を解決する必要がありました。



### 1. アップロード時点と投稿時点の不一致



ユーザーがエディタで画像をアップロードする時点と、実際に投稿を保存する時点が異なります。ユーザーが画像をアップロードした後、投稿作成をキャンセルすると、その画像はストレージに残り孤立ファイル(orphaned file)になります。



### 2. 投稿削除時の画像処理



投稿を削除する際、本文に含まれる画像をどう処理するかの問題があります。即座に削除すると復元が不可能になり、放置すると不要なストレージを占有します。



### 3. 外部画像と内部画像の区別



Markdownの特性上、外部URLの画像も含まれる可能性があるため、自社ストレージの画像のみを選択的に管理する必要があります。



---



## 解決策



### アーキテクチャ概要



問題解決のため、以下の構造を設計しました。



1. **画像アップロード時点**: R2ストレージに即座に保存し、メタデータをデータベースに記録

2. **投稿保存時点**: Markdownパースを通じて実際に使用された画像と投稿を紐付け

3. **投稿削除時点**: 紐付けられた画像をソフトデリート(soft delete)方式でマーク

4. **バッチ作業**: 一定時間以上の未使用画像と削除マークされた画像を整理



このアプローチには以下の利点があります。



- ユーザー体験を損なうことなく即座の画像アップロードが可能

- 24時間の猶予期間による意図しない削除の防止

- データベースベースの追跡による監査ログの確保



---



## 実装詳細



### 1. Entity設計



画像メタデータを管理するための`R2Image`エンティティを設計しました。



```java

@Entity

@Getter

@Builder

@NoArgsConstructor

@AllArgsConstructor

public class R2Image {

    @Id

    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;



    @Column(nullable = false)

    private Long userId;



    @Column(nullable = false)

    private String filename;



    @Column(nullable = false)

    private String url;



    @ManyToOne(fetch = FetchType.LAZY)

    @JoinColumn(name = "post_id")

    private Post post;  // NULL = まだ投稿に紐付けられていない



    @Column(nullable = false)

    @Builder.Default

    private Boolean isDeleted = false;



    @Column(nullable = false)

    @Builder.Default

    private ZonedDateTime createdAt = ZonedDateTime.now();



    private ZonedDateTime deletedAt;

}

```





主要な設計ポイントは以下の通りです。



- `post`フィールドが`null`の場合、まだ投稿に含まれていない画像と判断

- `isDeleted`フラグによるソフトデリートの実装

- `createdAt`を基準に一定時間経過の判断



### 2. 画像アップロードフロー



Toast UI Editorで画像アップロード時に`addImageBlobHook`を活用しました。



```javascript

addImageBlobHook: (blob, callback) => {

    let file;

    if (blob instanceof File) {

        file = blob;

    } else {

        file = new File([blob], `image-${Date.now()}.png`,

            { type: blob.type || 'image/png' });

    }

    uploadImageToR2(file, callback);

}

```





このフックはドラッグアンドドロップとコピー＆ペーストの両方をサポートし、BlobオブジェクトをFileオブジェクトに変換して一貫した処理を保証します。



サーバー側では以下のように処理します。



```java

@Transactional

public String uploadImage(MultipartFile file, Long userId) {

    validateImage(file);



    String filename = generateFileName(file.getOriginalFilename());

    String s3Key = String.format("images/user/%d/post/%s", userId, filename);



    // R2にアップロード

    s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));



    String imageUrl = generatePublicUrl(s3Key);



    // メタデータ保存 (postはNULL)

    R2Image image = R2Image.builder()

            .userId(userId)

            .filename(filename)

            .url(imageUrl)

            .post(null)

            .isDeleted(false)

            .build();



    imageRepository.save(image);



    return imageUrl;

}

```





ファイル名生成時にはタイムスタンプとUUIDを組み合わせて衝突を防止しました。



```java

private String generateFileName(String originalFilename) {

    String extension = getFileExtension(originalFilename);

    long timestamp = System.currentTimeMillis() / 1000;

    String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    return String.format("%d-%s.%s", timestamp, uuid, extension);

}

```





### 3. 投稿保存時の画像紐付け



投稿が保存されると、Markdown本文をパースして含まれる画像を抽出し紐付けます。



```java

private void linkImagesToPost(String content, Post post) {

    if (content == null) return;



    Pattern pattern = Pattern.compile("!\\[.*?\\]\\((.*?)\\)");

    Matcher matcher = pattern.matcher(content);



    while (matcher.find()) {

        String imageUrl = matcher.group(1);

        try {

            R2Image image = imageRepository.findByUrl(imageUrl);

            if (image != null && image.getPost() == null) {

                image.linkToPost(post);

                imageRepository.save(image);

            }

        } catch (Exception e) {

            // 外部画像は無視

        }

    }

}

```





正規表現を使用してMarkdownの画像構文`![alt](url)`をパースし、自社ストレージの画像のみを選択的に紐付けます。



### 4. 投稿削除時の画像マーク



投稿削除時、紐付けられたすべての画像を即座に削除せず`isDeleted`フラグでマークします。



```java

@Transactional

public void deletePost(String currentUserEmail, Long postId) {

    Post post = postRepository.getReferenceById(postId);



    if (!validatePostOwnership(post, currentUserEmail))

        throw new AccessDeniedException("修正権限がありません。");



    // 紐付けられたすべての画像をisDeleted = trueでマーク

    imageRepository.markAsDeletedByPostId(postId, ZonedDateTime.now());



    post.delete();

    postRepository.save(post);

}

```





Repositoryメソッドは、JPQLを使用してバルク更新を実行します。



```java

@Modifying

@Query("UPDATE R2Image r SET r.isDeleted = true, r.deletedAt = :deletedAt " +

       "WHERE r.post.id = :postId")

void markAsDeletedByPostId(@Param("postId") Long postId,

                           @Param("deletedAt") ZonedDateTime deletedAt);

```





### 5. バッチ作業による自動整理



Springの`@Scheduled`アノテーションを活用して、毎日午前3時に整理作業を実行します。



```java

@Component

@RequiredArgsConstructor

public class R2ImageBatch {



    @Scheduled(cron = "0 0 3 * * *")

    @Transactional

    public void cleanupOrphanedImages() {

        logger.info("R2画像整理作業開始...");



        try {

            cleanupDeletedPostImages();

            cleanupUnusedImages();

            logger.info("R2画像整理完了!");

        } catch (Exception e) {

            logger.error("R2画像整理中のエラー発生", e);

        }

    }



    private void cleanupDeletedPostImages() {

        List<String> deletedUrls = imageRepository.findUrlsByIsDeletedTrue();



        for (String url : deletedUrls) {

            imageService.deleteImage(url);

        }



        imageRepository.deleteByIsDeletedTrue();

    }



    private void cleanupUnusedImages() {

        ZonedDateTime twentyFourHoursAgo = ZonedDateTime.now().minusHours(24);

        List<String> orphanedUrls = imageRepository

            .findUrlsByPostIsNullAndCreatedAtBefore(twentyFourHoursAgo);



        for (String url : orphanedUrls) {

            imageService.deleteImage(url);

        }



        imageRepository.deleteByPostIsNullAndCreatedAtBefore(twentyFourHoursAgo);

    }

}

```





バッチ作業は2種類の画像を処理します。



1. **削除マークされた画像**: 投稿削除により`isDeleted`が`true`の画像

2. **未使用画像**: アップロード後24時間経過したが投稿に紐付けられていない画像



---



## 技術的考慮事項



### 1. トランザクション管理



画像アップロードとメタデータ保存を一つのトランザクションにまとめました。R2アップロードが成功してもデータベース保存に失敗すると孤立ファイルが生成される可能性がありますが、逆のケースよりも管理が容易だと判断しました。



### 2. 同時実行制御



同じ画像URLに対して複数のリクエストが同時に発生する可能性があるため、`findByUrl`照会時の重複処理に注意しました。現在は例外を無視する方式で処理していますが、トラフィックが増加すれば楽観的ロック(Optimistic Lock)を検討できます。



### 3. バッチ性能



大量の画像を処理する際、R2 API呼び出しがボトルネックになる可能性があります。現在は順次処理していますが、今後並列処理や非同期処理で改善できます。



### 4. 外部画像処理



Markdownには外部URLの画像も含まれる可能性があります。URLパース時に自社ドメインか確認して外部画像は紐付けないようにしました。



---



## 運用時の注意事項



### 1. 猶予期間の設定



現在は24時間に設定していますが、ユーザーパターンに応じて調整が必要な場合があります。短すぎるとユーザーの不便を、長すぎるとストレージの無駄を招きます。



### 2. ログとモニタリング



バッチ作業のログを定期的に確認し、異常な削除が発生していないかモニタリングする必要があります。SlackやEメールでアラート連携するのも良い方法です。



### 3. バックアップポリシー



ソフトデリート方式を使用しても、物理削除前のバックアップを考慮すべきです。法的要件やデータ復旧ポリシーに応じて別途アーカイブが必要な場合があります。



---



## 改善可能な点



### 1. 画像最適化



現在はアップロードされた画像をそのまま保存していますが、リサイズや圧縮を追加すればストレージコストと読み込み速度を改善できます。



### 2. CDN連携



Cloudflare R2はCDN連携が容易なため、パブリックURL生成時にCDNドメインを使用すれば転送速度を向上できます。



### 3. 重複排除



同じ画像を複数回アップロードする場合、ハッシュ値比較により重複を排除すればストレージを節約できます。



### 4. プレサインドURL



セキュリティが重要な画像の場合、プレサインドURL(Pre-signed URL)を生成して時間制限を設けることができます。



---



## おわりに



画像アップロード機能は単純に見えますが、実際の運用環境では多くの考慮事項があります。本記事で紹介した方式は、ユーザー体験と運用効率性のバランスを取るための一つのアプローチです。



特に`Soft Delete`とバッチ作業を組み合わせた方式は、即座の削除によるデータ損失を防ぎつつ、長期的にストレージを効率的に管理できる実用的な解決策だと考えます。



プロジェクトの特性と要件に応じて猶予期間、バッチ周期、整理ポリシーなどを調整して最適な運用方式を見つけてください。ありがとうございます。



---



## 参考資料



- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

- [AWS SDK for Java S3 Client](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3.html)

- [Spring Batch Documentation](https://spring.io/projects/spring-batch)

- [Toast UI Editor](https://ui.toast.com/tui-editor)
