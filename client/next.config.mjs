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
  // dev 서버 터미널에 서버 쪽 fetch 요청(API 주소, 상태 코드, 시간)을 찍는다
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
