import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // 누끼·상세 사진은 원본 해상도로 두고 90 품질로 내보낸다 (확대해도 선명하게)
    qualities: [75, 90],
    // 관리자 페이지에서 Supabase Storage에 올린 상품 이미지
    remotePatterns: [
      {
        protocol: "https",
        hostname: "udssnmygythognbuhobk.supabase.co",
        pathname: "/storage/v1/object/public/products/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
