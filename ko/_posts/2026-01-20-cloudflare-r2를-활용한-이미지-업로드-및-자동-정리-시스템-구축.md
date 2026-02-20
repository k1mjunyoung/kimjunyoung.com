---
layout: post
lang: ko
published: true
permalink: /ko/cloudflare-r2를-활용한-이미지-업로드-및-자동-정리-시스템-구축
commit_url:
date: 2026-01-20 17:44:07 +0900
link:
domain:
title: Cloudflare R2를 활용한 이미지 업로드 및 자동 정리 시스템 구축
description: ''
categories: 
redirect_from:
  - /ko/cloudflare-r2를-활용한-이미지-업로드-및-자동-정리-시스템-구축
---

## 들어가며



웹 애플리케이션에서 이미지 업로드 기능은 필수적이지만, 관리하지 않으면 사용되지 않는 파일들이 스토리지에 누적되어 비용과 관리 부담이 증가하게 됩니다. 특히 사용자가 이미지를 업로드한 후 게시물 작성을 취소하거나, 게시물을 삭제할 때 연결된 이미지를 어떻게 처리할 것인가는 중요한 과제입니다.



본 글에서는 Spring Boot 기반의 블로그 프로젝트에서 Toast UI Editor를 통한 이미지 업로드부터 Cloudflare R2 스토리지 저장, 그리고 배치 작업을 통한 자동 정리까지의 전체 과정을 소개합니다.



---



## 문제 정의



이미지 업로드 기능을 구현하면서 다음과 같은 문제들을 해결해야 했습니다.



### 1. 업로드 시점과 게시 시점의 불일치



사용자가 에디터에서 이미지를 업로드하는 시점과 실제로 게시물을 저장하는 시점이 다릅니다. 사용자가 이미지를 업로드한 후 게시물 작성을 취소하면 해당 이미지는 스토리지에 남게 되어 고아 파일(orphaned file)이 됩니다.



### 2. 게시물 삭제 시 이미지 처리



게시물을 삭제할 때 본문에 포함된 이미지들을 어떻게 처리할 것인가의 문제가 있습니다. 즉시 삭제하면 복구가 불가능하고, 방치하면 불필요한 저장 공간을 차지하게 됩니다.



### 3. 외부 이미지와 내부 이미지 구분



마크다운 특성상 외부 URL의 이미지도 포함될 수 있어, 자체 스토리지의 이미지만 선택적으로 관리해야 합니다.



---



## 해결 방안



### 아키텍처 개요



문제 해결을 위해 다음과 같은 구조를 설계했습니다.



1. **이미지 업로드 시점**: R2 스토리지에 즉시 저장하고 메타데이터를 데이터베이스에 기록

2. **게시물 저장 시점**: 마크다운 파싱을 통해 실제 사용된 이미지와 게시물을 연결

3. **게시물 삭제 시점**: 연결된 이미지를 소프트 딜리트(soft delete) 방식으로 표시

4. **배치 작업**: 일정 시간 이상 미사용 이미지와 삭제 표시된 이미지를 정리



이러한 접근 방식은 다음과 같은 장점이 있습니다.



- 사용자 경험 저하 없이 즉각적인 이미지 업로드 가능

- 24시간 유예 기간을 통한 의도치 않은 삭제 방지

- 데이터베이스 기반 추적으로 감사 로그 확보



---



## 구현 상세



### 1. Entity 설계



이미지 메타데이터를 관리하기 위한 `R2Image` 엔티티를 설계했습니다.



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

    private Post post;  // NULL = 아직 게시물에 연결되지 않음



    @Column(nullable = false)

    @Builder.Default

    private Boolean isDeleted = false;



    @Column(nullable = false)

    @Builder.Default

    private ZonedDateTime createdAt = ZonedDateTime.now();



    private ZonedDateTime deletedAt;

}

```





핵심 설계 포인트는 다음과 같습니다.



- `post` 필드가 `null`인 경우 아직 게시물에 포함되지 않은 이미지로 판단

- `isDeleted` 플래그를 통한 소프트 딜리트 구현

- `createdAt`을 기준으로 일정 시간 경과 여부 판단



### 2. 이미지 업로드 플로우



Toast UI Editor에서 이미지 업로드 시 `addImageBlobHook`을 활용했습니다.



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





이 훅은 드래그앤드롭과 복사/붙여넣기 모두를 지원하며, Blob 객체를 File 객체로 변환하여 일관된 처리를 보장합니다.



서버 측에서는 다음과 같이 처리합니다.



```java

@Transactional

public String uploadImage(MultipartFile file, Long userId) {

    validateImage(file);

    

    String filename = generateFileName(file.getOriginalFilename());

    String s3Key = String.format("images/user/%d/post/%s", userId, filename);

    

    // R2에 업로드

    s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

    

    String imageUrl = generatePublicUrl(s3Key);

    

    // 메타데이터 저장 (post는 NULL)

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





파일명 생성 시에는 타임스탬프와 UUID를 조합하여 충돌을 방지했습니다.



```java

private String generateFileName(String originalFilename) {

    String extension = getFileExtension(originalFilename);

    long timestamp = System.currentTimeMillis() / 1000;

    String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    return String.format("%d-%s.%s", timestamp, uuid, extension);

}

```





### 3. 게시물 저장 시 이미지 연결



게시물이 저장되면 마크다운 본문을 파싱하여 포함된 이미지를 추출하고 연결합니다.



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

            // 외부 이미지는 무시

        }

    }

}

```





정규표현식을 사용하여 마크다운의 이미지 문법 `![alt](url)`을 파싱하며, 자체 스토리지의 이미지만 선택적으로 연결합니다.



### 4. 게시물 삭제 시 이미지 표시



게시물 삭제 시 연결된 모든 이미지를 즉시 삭제하지 않고 `isDeleted` 플래그로 표시합니다.



```java

@Transactional

public void deletePost(String currentUserEmail, Long postId) {

    Post post = postRepository.getReferenceById(postId);

    

    if (!validatePostOwnership(post, currentUserEmail))

        throw new AccessDeniedException("수정 권한이 없습니다.");

    

    // 연결된 모든 이미지를 isDeleted = true로 표시

    imageRepository.markAsDeletedByPostId(postId, ZonedDateTime.now());

    

    post.delete();

    postRepository.save(post);

}

```





Repository 메서드는 JPQL을 사용하여 벌크 업데이트를 수행합니다.



```java

@Modifying

@Query("UPDATE R2Image r SET r.isDeleted = true, r.deletedAt = :deletedAt " +

       "WHERE r.post.id = :postId")

void markAsDeletedByPostId(@Param("postId") Long postId, 

                           @Param("deletedAt") ZonedDateTime deletedAt);

```





### 5. 배치 작업을 통한 자동 정리



Spring의 `@Scheduled` 어노테이션을 활용하여 매일 새벽 3시에 정리 작업을 수행합니다.



```java

@Component

@RequiredArgsConstructor

public class R2ImageBatch {

    

    @Scheduled(cron = "0 0 3 * * *")

    @Transactional

    public void cleanupOrphanedImages() {

        logger.info("R2 이미지 정리 작업 시작...");

        

        try {

            cleanupDeletedPostImages();

            cleanupUnusedImages();

            logger.info("R2 이미지 정리 완료!");

        } catch (Exception e) {

            logger.error("R2 이미지 정리 중 오류 발생", e);

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





배치 작업은 두 가지 유형의 이미지를 처리합니다.



1. **삭제 표시된 이미지**: 게시물 삭제로 인해 `isDeleted`가 `true`인 이미지

2. **미사용 이미지**: 업로드 후 24시간이 경과했으나 게시물에 연결되지 않은 이미지



---



## 기술적 고려사항



### 1. 트랜잭션 관리



이미지 업로드와 메타데이터 저장은 하나의 트랜잭션으로 묶었습니다. R2 업로드가 성공했으나 데이터베이스 저장이 실패하면 고아 파일이 생성될 수 있지만, 반대의 경우보다 관리가 용이하다고 판단했습니다.



### 2. 동시성 제어



동일한 이미지 URL에 대해 여러 요청이 동시에 발생할 수 있으므로, `findByUrl` 조회 시 중복 처리에 유의했습니다. 현재는 예외를 무시하는 방식으로 처리했으나, 트래픽이 증가하면 낙관적 락(Optimistic Lock)을 고려할 수 있습니다.



### 3. 배치 성능



대량의 이미지를 처리할 때 R2 API 호출이 병목이 될 수 있습니다. 현재는 순차 처리하지만, 향후 병렬 처리나 비동기 처리로 개선할 수 있습니다.



### 4. 외부 이미지 처리



마크다운에는 외부 URL의 이미지도 포함될 수 있습니다. URL 파싱 시 자체 도메인인지 확인하여 외부 이미지는 연결하지 않도록 했습니다.



---



## 운영 시 주의사항



### 1. 유예 기간 설정



현재는 24시간으로 설정했으나, 사용자 패턴에 따라 조정이 필요할 수 있습니다. 너무 짧으면 사용자 불편을, 너무 길면 스토리지 낭비를 초래합니다.



### 2. 로깅 및 모니터링



배치 작업의 로그를 주기적으로 확인하여 비정상적인 삭제가 발생하지 않는지 모니터링해야 합니다. Slack이나 이메일로 알림을 연동하는 것도 좋은 방법입니다.



### 3. 백업 정책



소프트 딜리트 방식을 사용하더라도 물리적 삭제 전 백업을 고려해야 합니다. 법적 요구사항이나 데이터 복구 정책에 따라 별도의 아카이빙이 필요할 수 있습니다.



---



## 개선 가능한 점



### 1. 이미지 최적화



현재는 업로드된 이미지를 그대로 저장하지만, 리사이징이나 압축을 추가하면 스토리지 비용과 로딩 속도를 개선할 수 있습니다.



### 2. CDN 연동



Cloudflare R2는 CDN 연동이 용이하므로, 퍼블릭 URL 생성 시 CDN 도메인을 사용하면 전송 속도를 향상시킬 수 있습니다.



### 3. 중복 제거



동일한 이미지를 여러 번 업로드하는 경우 해시값 비교를 통해 중복을 제거하면 스토리지를 절약할 수 있습니다.



### 4. 프리사인드 URL



보안이 중요한 이미지의 경우 프리사인드 URL(Pre-signed URL)을 생성하여 시간 제한을 둘 수 있습니다.



---



## 마치며



이미지 업로드 기능은 단순해 보이지만, 실제 운영 환경에서는 많은 고려사항이 있습니다. 본 글에서 소개한 방식은 사용자 경험과 운영 효율성 사이의 균형을 맞추기 위한 하나의 접근법입니다.



특히 `Soft Delete` 와 배치 작업을 조합한 방식은 즉각적인 삭제로 인한 데이터 손실을 방지하면서도, 장기적으로 스토리지를 효율적으로 관리할 수 있는 실용적인 해법이라고 생각합니다.



프로젝트의 특성과 요구사항에 따라 유예 기간, 배치 주기, 정리 정책 등을 조정하여 최적의 운영 방식을 찾아가시기 바랍니다. 감사합니다.



---



## 참고 자료



- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

- [AWS SDK for Java S3 Client](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3.html)

- [Spring Batch Documentation](https://spring.io/projects/spring-batch)

- [Toast UI Editor](https://ui.toast.com/tui-editor)