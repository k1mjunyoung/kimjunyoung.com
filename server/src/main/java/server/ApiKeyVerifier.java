package server;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import server.exception.UnauthorizedException;

/** 쓰기 API 인증. .env의 API_KEY와 비교한다. API_KEY가 비어 있으면 쓰기 API는 전부 거부 */
@Component
public class ApiKeyVerifier {

    private static final String BEARER = "Bearer ";

    private final byte[] apiKey;

    public ApiKeyVerifier(@Value("${app.api-key:}") String apiKey) {
        this.apiKey = apiKey.strip().getBytes(StandardCharsets.UTF_8);
    }

    /** 우선순위: Authorization: Bearer → X-API-Key 헤더 → 바디 apiKey */
    public void verify(String authorization, String headerKey, String bodyKey) {
        if (apiKey.length == 0) {
            throw new UnauthorizedException("서버에 API_KEY가 설정되지 않았습니다");
        }
        String given = firstNonBlank(bearer(authorization), headerKey, bodyKey);
        if (given == null) {
            throw new UnauthorizedException("API 키가 없습니다");
        }
        // 시간 차로 키를 추측하지 못하게 상수 시간 비교
        if (!MessageDigest.isEqual(apiKey, given.strip().getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("API 키가 맞지 않습니다");
        }
    }

    private static String bearer(String authorization) {
        if (authorization != null && authorization.regionMatches(true, 0, BEARER, 0, BEARER.length())) {
            return authorization.substring(BEARER.length());
        }
        return null;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }
}
