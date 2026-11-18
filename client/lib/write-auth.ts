// 글 작성(/write) 접근용 세션. middleware(Edge)와 서버 액션(Node)에서 같이 쓰므로 Web Crypto만 쓴다.
//
// 쿠키 값: "<만료 시각(ms)>.<HMAC-SHA256(key=WRITE_PASSWORD, msg=만료 시각) hex>"
// - 암호를 바꾸면 기존 세션이 모두 무효가 된다
// - 서버에 세션 저장소가 필요 없다

export const WRITE_COOKIE = "write_session";
export const WRITE_SESSION_DAYS = 7;

const encoder = new TextEncoder();

function password(): string | undefined {
  const value = process.env.WRITE_PASSWORD;
  return value && value.length > 0 ? value : undefined;
}

async function hmacHex(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 길이가 같으면 내용과 상관없이 같은 시간이 걸리는 비교 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** 입력한 암호가 맞는지. WRITE_PASSWORD가 없으면 항상 false (작성 기능 꺼짐) */
export async function checkPassword(input: string): Promise<boolean> {
  const pw = password();
  if (!pw) return false;
  // 길이 차이로 새지 않도록 양쪽을 같은 길이의 해시로 바꿔 비교한다
  const [a, b] = await Promise.all([hmacHex(pw, `pw:${input}`), hmacHex(pw, `pw:${pw}`)]);
  return safeEqual(a, b);
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const pw = password();
  if (!pw) throw new Error("[write-auth] WRITE_PASSWORD 환경변수가 없습니다");
  const expires = String(now + WRITE_SESSION_DAYS * 24 * 60 * 60 * 1000);
  return `${expires}.${await hmacHex(pw, `session:${expires}`)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  const pw = password();
  if (!pw || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expires = token.slice(0, dot);
  if (!/^\d+$/.test(expires) || Number(expires) < now) return false;
  return safeEqual(token.slice(dot + 1), await hmacHex(pw, `session:${expires}`));
}
