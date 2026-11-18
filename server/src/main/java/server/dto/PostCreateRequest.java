package server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * POST /api/posts 요청 바디. client app/write/actions.ts의 PostCreateInput과 같은 모양.
 * apiKey는 헤더 대신 바디로 인증할 때만 쓴다 (헤더가 있으면 무시).
 */
public record PostCreateRequest(
        @NotBlank @Size(max = 255) String title,
        // URL 한 칸에 들어가야 한다. 한글 slug는 허용 (client validate와 같은 규칙)
        @NotBlank @Size(max = 255) @Pattern(regexp = "[^\\s/?#%\\\\]+", message = "slug에는 공백과 / ? # % \\ 를 쓸 수 없습니다")
        String slug,
        String description,
        List<String> tags,
        @NotBlank String content,
        @Pattern(regexp = "https?://.+", message = "썸네일은 http(s) URL이어야 합니다") String thumbnailUrl,
        /** true면 지금 시각으로 발행, false나 null이면 비공개 저장 */
        Boolean publish,
        String apiKey) {

    @Override
    public String toString() {
        // 로그에 키가 찍히지 않게 한다
        return "PostCreateRequest[slug=" + slug + ", title=" + title + ", publish=" + publish + "]";
    }
}
