package server;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findBySlugAndIsPublishedTrueAndDeletedAtIsNull(String slug);

    List<Post> findByIsPublishedTrueAndDeletedAtIsNullOrderByPublishedAtDescIdDesc();

    /** 기준 글보다 최신 글. 가까운 순 */
    @Query("""
        select p from Post p
        where p.isPublished = true and p.deletedAt is null
          and (p.publishedAt > :at or (p.publishedAt = :at and p.id > :id))
        order by p.publishedAt asc, p.id asc
        """)
    List<Post> findNewer(@Param("at") Instant at, @Param("id") Long id, Pageable pageable);

    /** 기준 글보다 오래된 글. 가까운 순 */
    @Query("""
        select p from Post p
        where p.isPublished = true and p.deletedAt is null
          and (p.publishedAt < :at or (p.publishedAt = :at and p.id < :id))
        order by p.publishedAt desc, p.id desc
        """)
    List<Post> findOlder(@Param("at") Instant at, @Param("id") Long id, Pageable pageable);
}
