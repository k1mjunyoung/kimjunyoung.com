package server.exception;

import jakarta.validation.ConstraintViolationException;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(PostNotFoundException.class)
    public ProblemDetail handlePostNotFound(PostNotFoundException e) {
        // client 빌드(generateStaticParams) 때도 나올 수 있어서 debug
        log.debug("글 없음: {}", e.getMessage());
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ProblemDetail handleUnauthorized(UnauthorizedException e) {
        // 키 값은 남기지 않고 실패 사유만 남긴다
        log.warn("인증 실패: {}", e.getMessage());
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(DuplicateSlugException.class)
    public ProblemDetail handleDuplicateSlug(DuplicateSlugException e) {
        log.warn("slug 중복: {}", e.getMessage());
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }

    /** 바디 검증 실패. 필드별 메시지를 detail 한 줄로 */
    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleInvalid(ConstraintViolationException e) {
        String detail = e.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .sorted()
                .collect(Collectors.joining(", "));
        log.warn("요청 검증 실패: {}", detail);
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadable(HttpMessageNotReadableException e) {
        log.warn("요청 바디를 읽을 수 없음: {}", e.getMostSpecificCause().getMessage());
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "요청 바디를 읽을 수 없습니다 (JSON 형식 확인)");
    }
}
