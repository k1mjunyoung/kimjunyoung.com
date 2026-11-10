package server.dto;

import java.time.Instant;
import java.util.List;
import server.Post;

public record PostResponse(
        String slug,
        String title,
        String description,
        List<String> tags,
        String content,
        String thumbnailUrl,
        Instant publishedAt,
        Instant updatedAt) {

    public static PostResponse from(Post post) {
        return new PostResponse(
                post.getSlug(),
                post.getTitle(),
                post.getDescription(),
                post.getTags() != null ? List.copyOf(post.getTags()) : List.of(),
                post.getContent(),
                post.getThumbnailUrl(),
                post.getPublishedAt(),
                post.getUpdatedAt());
    }
}
