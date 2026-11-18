package server;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import java.net.URI;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import server.dto.AdjacentPostsResponse;
import server.dto.PostCreateRequest;
import server.dto.PostResponse;
import server.dto.PostSummaryResponse;

@Tag(name = "Posts", description = "블로그 글 조회와 작성")
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final ApiKeyVerifier apiKeyVerifier;
    private final Validator validator;

    @Operation(summary = "공개 글 목록", description = "발행된 글만 최신순으로 돌려준다. 본문(content)은 빼고 요약과 읽는 시간만 담는다")
    @GetMapping
    public List<PostSummaryResponse> getPosts() {
        return postService.getPosts();
    }

    @Operation(summary = "글 한 건 조회", description = "slug로 발행된 글을 본문까지 돌려준다")
    @ApiResponse(responseCode = "404", description = "없거나 발행되지 않은 글")
    @GetMapping("/{slug}")
    public PostResponse getPost(@Parameter(description = "글 주소", example = "hello-world") @PathVariable String slug) {
        return postService.getPost(slug);
    }

    @Operation(summary = "이전/다음 글", description = "newer는 더 최근 글, older는 더 오래된 글. 없으면 null")
    @ApiResponse(responseCode = "404", description = "없거나 발행되지 않은 글")
    @GetMapping("/{slug}/adjacent")
    public AdjacentPostsResponse getAdjacentPosts(@Parameter(description = "기준 글 주소", example = "hello-world") @PathVariable String slug) {
        return postService.getAdjacentPosts(slug);
    }

    /** 글 작성. 인증: Authorization: Bearer {API_KEY}, X-API-Key 헤더, 바디 apiKey 중 하나 */
    @Operation(summary = "글 작성",
            description = "API 키가 필요하다. Authorization: Bearer {API_KEY}, X-API-Key 헤더, 바디 apiKey 중 하나로 보낸다")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "201", description = "작성됨. Location 헤더에 글 주소")
    @ApiResponse(responseCode = "400", description = "검증 실패 또는 읽을 수 없는 바디")
    @ApiResponse(responseCode = "401", description = "API 키가 없거나 맞지 않음")
    @ApiResponse(responseCode = "409", description = "이미 있는 slug (삭제된 글 포함)")
    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestHeader(value = "X-API-Key", required = false) String headerKey,
            @RequestBody PostCreateRequest request) {
        // 인증을 먼저 해서 키 없는 요청에는 검증 메시지도 내주지 않는다 (그래서 @Valid 대신 직접 검증)
        apiKeyVerifier.verify(authorization, headerKey, request.apiKey());
        Set<ConstraintViolation<PostCreateRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }

        PostResponse created = postService.createPost(request);
        URI location = UriComponentsBuilder.fromPath("/api/posts/{slug}")
                .buildAndExpand(created.slug()).encode().toUri();
        return ResponseEntity.created(location).body(created);
    }
}
