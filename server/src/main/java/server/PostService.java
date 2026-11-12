package server;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.dto.AdjacentPostsResponse;
import server.dto.PostResponse;
import server.dto.PostSummaryResponse;
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

    private Post findPublished(String slug) {
        return postRepository.findBySlugAndIsPublishedTrueAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new PostNotFoundException(slug));
    }
}
