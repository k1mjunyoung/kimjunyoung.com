package server.dto;

import java.time.Instant;
import java.util.List;
import server.Post;
import server.PostSummaryUtils;

/** 목록, 이전/다음, 검색 인덱스 공용. content는 내려주지 않는다 */
public record PostSummaryResponse(
        String slug,
        String title,
        String summary,
        List<String> tags,
        String thumbnailUrl,
        Instant publishedAt,
        int readMinutes) {

    public static PostSummaryResponse from(Post post) {
        return new PostSummaryResponse(
                post.getSlug(),
                post.getTitle(),
                PostSummaryUtils.summary(post.getDescription(), post.getContent()),
                post.getTags() != null ? List.copyOf(post.getTags()) : List.of(),
                post.getThumbnailUrl(),
                post.getPublishedAt(),
                PostSummaryUtils.readMinutes(post.getContent()));
    }
}
