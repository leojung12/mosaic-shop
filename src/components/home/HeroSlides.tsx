
"use client";

export default function HeroSlides() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#A9C3E2]">
      {/* PC용 이미지 */}
      <img
        src="/home/mosaic-hero.png"
        alt="MOSAIC floral collection"
        className="hidden h-full w-full object-cover object-center md:block"
      />

      {/* 모바일용 이미지 */}
      <img
        src="/home/mosaic-hero-mobile.png"
        alt="MOSAIC floral collection"
        className="block h-full w-full object-cover object-[55%_center] md:hidden"
      />
    </div>
  );
}
