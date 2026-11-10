package server;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import server.dto.AdjacentPostsResponse;
import server.dto.PostResponse;
import server.dto.PostSummaryResponse;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

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
}
