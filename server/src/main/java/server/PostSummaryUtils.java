package server;

/** client lib/post-meta.ts의 toSummary, readMinutes와 lib/markdown.ts의 extractPreview를 옮긴 것 */
public final class PostSummaryUtils {

    private static final int PREVIEW_LENGTH = 120;
    private static final int CHARS_PER_MINUTE = 500; // 한글 기준 분당 약 500자

    private PostSummaryUtils() {
    }

    /** 직접 쓴 description, 없으면 본문 앞부분 */
    public static String summary(String description, String content) {
        if (description != null && !description.isBlank()) {
            return description.strip();
        }
        return preview(content, PREVIEW_LENGTH);
    }

    public static int readMinutes(String content) {
        int length = content.replaceAll("\\s+", "").length();
        return Math.max(1, Math.round(length / (float) CHARS_PER_MINUTE));
    }

    /** 마크다운 문법을 걷어낸 본문 앞부분 */
    static String preview(String content, int maxLength) {
        String stripped = content
                .replaceAll("```[\\s\\S]*?```", "")             // 코드 블록
                .replaceAll("`[^`]*`", "")                      // 인라인 코드
                .replaceAll("!\\[.*?\\]\\(.*?\\)", "")          // 이미지
                .replaceAll("\\[([^\\]]+)\\]\\(.*?\\)", "$1")   // 링크는 텍스트만
                .replaceAll("(?m)^#{1,6}\\s+", "")              // 제목 기호
                .replaceAll("[*_]{1,3}([^*_]+)[*_]{1,3}", "$1") // 강조
                .replaceAll("(?m)^\\s*[-*>]\\s+", "")           // 목록, 인용
                .replaceAll("<[^>]+>", "")                      // HTML 태그
                .replaceAll("\\s+", " ")
                .strip();
        return stripped.length() > maxLength
                ? stripped.substring(0, maxLength) + "…"
                : stripped;
    }
}
