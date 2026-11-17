/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // starry-night(코드 하이라이트)는 번들에 넣으면 vscode-oniguruma를 빌드 서버 경로(/vercel/path0)에서
  // 찾으려 해서, 서버에서 글 페이지를 다시 그릴 때(revalidate, 새 글) ERR_MODULE_NOT_FOUND로 500이 난다.
  // 번들 밖(node_modules)에서 불러오게 해서 함수 번들에 실제 패키지가 같이 들어가게 한다
  serverExternalPackages: ['@wooorm/starry-night', 'vscode-oniguruma'],
  // dev 서버 터미널에 서버 쪽 fetch 요청(API 주소, 상태 코드, 시간)을 찍는다
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
