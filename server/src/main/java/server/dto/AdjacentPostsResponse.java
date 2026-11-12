package server.dto;

/** newer: 바로 최신 글, older: 바로 오래된 글. 없으면 null */
public record AdjacentPostsResponse(PostSummaryResponse newer, PostSummaryResponse older) {
}
