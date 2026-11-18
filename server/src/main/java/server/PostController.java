package server;

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

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final ApiKeyVerifier apiKeyVerifier;
    private final Validator validator;

    @GetMapping
    public List<PostSummaryResponse> getPosts() {
        return postService.getPosts();
    }

    @GetMapping("/{slug}")
    public PostResponse getPost(@PathVariable String slug) {
        return postService.getPost(slug);
    }

    @GetMapping("/{slug}/adjacent")
    public AdjacentPostsResponse getAdjacentPosts(@PathVariable String slug) {
        return postService.getAdjacentPosts(slug);
    }

    /** 글 작성. 인증: Authorization: Bearer {API_KEY}, X-API-Key 헤더, 바디 apiKey 중 하나 */
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
