package server;

import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.dto.AdjacentPostsResponse;
import server.dto.PostCreateRequest;
import server.dto.PostResponse;
import server.dto.PostSummaryResponse;
import server.exception.DuplicateSlugException;
import server.exception.PostNotFoundException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private static final Pageable FIRST = PageRequest.of(0, 1);

    private final PostRepository postRepository;

    public List<PostSummaryResponse> getPosts() {
        return postRepository.findByIsPublishedTrueAndDeletedAtIsNullOrderByPublishedAtDescIdDesc()
                .stream()
                .map(PostSummaryResponse::from)
                .toList();
    }

    public PostResponse getPost(String slug) {
        return PostResponse.from(findPublished(slug));
    }

    public AdjacentPostsResponse getAdjacentPosts(String slug) {
        Post post = findPublished(slug);
        PostSummaryResponse newer = postRepository.findNewer(post.getPublishedAt(), post.getId(), FIRST)
                .stream().findFirst().map(PostSummaryResponse::from).orElse(null);
        PostSummaryResponse older = postRepository.findOlder(post.getPublishedAt(), post.getId(), FIRST)
                .stream().findFirst().map(PostSummaryResponse::from).orElse(null);
        return new AdjacentPostsResponse(newer, older);
    }

    @Transactional
    public PostResponse createPost(PostCreateRequest request) {
        String slug = request.slug().strip();
        // slug는 unique라 삭제된 글(deleted_at)과도 겹치면 안 된다
        if (postRepository.existsBySlug(slug)) {
            throw new DuplicateSlugException(slug);
        }
        Post post = Post.builder()
                .title(request.title().strip())
                .slug(slug)
                .description(blankToNull(request.description()))
                .tags(normalizeTags(request.tags()))
                .content(request.content())
                .thumbnailUrl(blankToNull(request.thumbnailUrl()))
                .build();
        if (Boolean.TRUE.equals(request.publish())) {
            post.publish(Instant.now());
        }
        try {
            // flush해서 동시 요청으로 unique 위반이 나면 여기서 409로 바꾼다
            return PostResponse.from(postRepository.saveAndFlush(post));
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateSlugException(slug);
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    /** 앞뒤 공백 제거, 빈 값과 중복 제거 (순서 유지) */
    private static List<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return List.of();
        }
        return tags.stream()
                .filter(t -> t != null && !t.isBlank())
                .map(String::strip)
                .distinct()
                .toList();
    }

    private Post findPublished(String slug) {
        return postRepository.findBySlugAndIsPublishedTrueAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new PostNotFoundException(slug));
    }
}
