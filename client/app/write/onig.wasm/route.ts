import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 글 작성 미리보기(브라우저)의 코드 하이라이트용 oniguruma WASM.
 * starry-night 기본값은 esm.sh에서 받아오므로, 외부 CDN에 기대지 않도록 빌드 때 정적 파일로 만들어 직접 내려준다.
 * /write 아래라 middleware의 로그인 확인을 거친다.
 */
export const dynamic = "force-static";

export async function GET() {
  const wasm = await readFile(
    path.join(process.cwd(), "node_modules", "vscode-oniguruma", "release", "onig.wasm"),
  );
  return new Response(new Uint8Array(wasm), {
    headers: {
      "Content-Type": "application/wasm",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
