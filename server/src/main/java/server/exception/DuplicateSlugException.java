package server.exception;

public class DuplicateSlugException extends RuntimeException {

    public DuplicateSlugException(String slug) {
        super("이미 있는 slug입니다: " + slug);
    }
}
