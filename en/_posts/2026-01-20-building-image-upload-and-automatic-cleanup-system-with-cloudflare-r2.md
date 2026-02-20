---
layout: post
lang: en
published: true
permalink: /en/building-image-upload-and-automatic-cleanup-system-with-cloudflare-r2
commit_url:
date: 2026-01-20 17:44:07 +0900
link:
domain:
title: Building Image Upload and Automatic Cleanup System with Cloudflare R2
description: ''
categories:
redirect_from:
  - /en/building-image-upload-and-automatic-cleanup-system-with-cloudflare-r2
---

## Introduction



Image upload functionality is essential in web applications, but if not managed, unused files accumulate in storage, increasing costs and management burden. Particularly, how to handle connected images when users upload images and then cancel post creation, or when deleting posts, is an important challenge.



This article introduces the entire process from image upload through Toast UI Editor in a Spring Boot-based blog project, to Cloudflare R2 storage saving, and automatic cleanup through batch jobs.



---



## Problem Definition



While implementing image upload functionality, we needed to solve the following problems.



### 1. Mismatch Between Upload Time and Posting Time



The time when users upload images in the editor differs from the time when they actually save the post. If users upload images and then cancel post creation, those images remain in storage, becoming orphaned files.



### 2. Image Handling When Deleting Posts



There is the question of how to handle images included in the post body when deleting posts. Immediate deletion makes recovery impossible, while leaving them wastes unnecessary storage space.



### 3. Distinguishing External and Internal Images



Due to markdown characteristics, images from external URLs can also be included, so we need to selectively manage only images from our own storage.



---



## Solution



### Architecture Overview



We designed the following structure to solve the problems.



1. **Image Upload Time**: Save immediately to R2 storage and record metadata in database

2. **Post Save Time**: Connect actually used images with posts through markdown parsing

3. **Post Delete Time**: Mark connected images with soft delete method

4. **Batch Job**: Clean up images unused for a certain time and images marked for deletion



This approach has the following advantages.



- Immediate image upload possible without degrading user experience

- Prevention of unintended deletion through 24-hour grace period

- Audit log secured through database-based tracking



---



## Implementation Details



### 1. Entity Design



We designed the `R2Image` entity to manage image metadata.



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

    private Post post;  // NULL = not yet linked to post



    @Column(nullable = false)

    @Builder.Default

    private Boolean isDeleted = false;



    @Column(nullable = false)

    @Builder.Default

    private ZonedDateTime createdAt = ZonedDateTime.now();



    private ZonedDateTime deletedAt;

}

```





Key design points are as follows.



- Judge images not yet included in posts when `post` field is `null`

- Soft delete implementation through `isDeleted` flag

- Determine whether certain time has elapsed based on `createdAt`



### 2. Image Upload Flow



We utilized `addImageBlobHook` for image upload in Toast UI Editor.



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





This hook supports both drag-and-drop and copy/paste, ensuring consistent processing by converting Blob objects to File objects.



Server-side processing is as follows.



```java

@Transactional

public String uploadImage(MultipartFile file, Long userId) {

    validateImage(file);



    String filename = generateFileName(file.getOriginalFilename());

    String s3Key = String.format("images/user/%d/post/%s", userId, filename);



    // Upload to R2

    s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));



    String imageUrl = generatePublicUrl(s3Key);



    // Save metadata (post is NULL)

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





When generating filenames, we prevented collisions by combining timestamp and UUID.



```java

private String generateFileName(String originalFilename) {

    String extension = getFileExtension(originalFilename);

    long timestamp = System.currentTimeMillis() / 1000;

    String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    return String.format("%d-%s.%s", timestamp, uuid, extension);

}

```





### 3. Linking Images When Saving Posts



When posts are saved, we parse the markdown body to extract and link included images.



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

            // Ignore external images

        }

    }

}

```





We parse markdown's image syntax `![alt](url)` using regular expressions, selectively linking only images from our own storage.



### 4. Marking Images When Deleting Posts



When deleting posts, we don't immediately delete all connected images but mark them with the `isDeleted` flag.



```java

@Transactional

public void deletePost(String currentUserEmail, Long postId) {

    Post post = postRepository.getReferenceById(postId);



    if (!validatePostOwnership(post, currentUserEmail))

        throw new AccessDeniedException("No edit permission.");



    // Mark all connected images as isDeleted = true

    imageRepository.markAsDeletedByPostId(postId, ZonedDateTime.now());



    post.delete();

    postRepository.save(post);

}

```





The repository method performs bulk updates using JPQL.



```java

@Modifying

@Query("UPDATE R2Image r SET r.isDeleted = true, r.deletedAt = :deletedAt " +

       "WHERE r.post.id = :postId")

void markAsDeletedByPostId(@Param("postId") Long postId,

                           @Param("deletedAt") ZonedDateTime deletedAt);

```





### 5. Automatic Cleanup Through Batch Jobs



Using Spring's `@Scheduled` annotation, we perform cleanup work daily at 3 AM.



```java

@Component

@RequiredArgsConstructor

public class R2ImageBatch {



    @Scheduled(cron = "0 0 3 * * *")

    @Transactional

    public void cleanupOrphanedImages() {

        logger.info("Starting R2 image cleanup...");



        try {

            cleanupDeletedPostImages();

            cleanupUnusedImages();

            logger.info("R2 image cleanup completed!");

        } catch (Exception e) {

            logger.error("Error during R2 image cleanup", e);

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





The batch job processes two types of images.



1. **Images marked for deletion**: Images where `isDeleted` is `true` due to post deletion

2. **Unused images**: Images that have passed 24 hours since upload but are not linked to posts



---



## Technical Considerations



### 1. Transaction Management



Image upload and metadata saving are wrapped in one transaction. If R2 upload succeeds but database saving fails, orphaned files may be created, but we judged this easier to manage than the opposite case.



### 2. Concurrency Control



Since multiple requests may occur simultaneously for the same image URL, we were careful about duplicate processing when querying with `findByUrl`. Currently, we handle by ignoring exceptions, but if traffic increases, we can consider optimistic locking.



### 3. Batch Performance



R2 API calls can become a bottleneck when processing large amounts of images. Currently processing sequentially, but can be improved with parallel or asynchronous processing in the future.



### 4. External Image Handling



External URL images can also be included in markdown. When parsing URLs, we checked if they are our own domain to avoid linking external images.



---



## Operational Considerations



### 1. Grace Period Settings



Currently set to 24 hours, but adjustment may be needed according to user patterns. Too short causes user inconvenience, while too long causes storage waste.



### 2. Logging and Monitoring



Batch job logs should be periodically checked to monitor for abnormal deletions. Integrating alerts with Slack or email is also a good method.



### 3. Backup Policy



Even when using soft delete method, backups before physical deletion should be considered. Separate archiving may be needed according to legal requirements or data recovery policies.



---



## Potential Improvements



### 1. Image Optimization



Currently saving uploaded images as-is, but adding resizing or compression can improve storage costs and loading speed.



### 2. CDN Integration



Cloudflare R2 makes CDN integration easy, so using CDN domain when generating public URLs can improve transfer speed.



### 3. Deduplication



When uploading the same image multiple times, eliminating duplicates through hash value comparison can save storage.



### 4. Pre-signed URLs



For security-critical images, time limitations can be set by generating pre-signed URLs.



---



## Conclusion



Image upload functionality seems simple, but there are many considerations in actual production environments. The method introduced in this article is one approach to balance user experience and operational efficiency.



Particularly, the combination of `Soft Delete` and batch jobs is a practical solution that prevents data loss from immediate deletion while efficiently managing storage in the long term.



Please adjust grace period, batch cycle, cleanup policy, etc., according to project characteristics and requirements to find the optimal operational method. Thank you.



---



## References



- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

- [AWS SDK for Java S3 Client](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3.html)

- [Spring Batch Documentation](https://spring.io/projects/spring-batch)

- [Toast UI Editor](https://ui.toast.com/tui-editor)
