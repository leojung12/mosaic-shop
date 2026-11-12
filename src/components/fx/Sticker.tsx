// 오브제 모서리에 붙는 원형 스티커 (NEW, PICK …). 호버하면 똑바로 서며 살짝 커진다.
export default function Sticker({ text, active, large }: { text: string; active?: boolean; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute top-0 right-0 z-10 flex translate-x-[45%] -translate-y-[20%] items-center justify-center rounded-full bg-(--accent) text-center font-mono leading-[1.05] font-medium tracking-[0.02em] text-[#ffffff] uppercase shadow-[0_6px_18px_-6px_rgb(0_0_0/0.35)] transition-[rotate,scale] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        large ? "size-[64px] text-[11px]" : "size-[52px] text-[9.5px]"
      } ${active ? "rotate-0 scale-110" : "-rotate-[14deg]"}`}
    >
      <span className="max-w-[80%]">{text}</span>
    </span>
  );
}
