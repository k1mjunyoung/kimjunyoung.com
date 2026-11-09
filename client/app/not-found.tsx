import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[880px] px-5">
      <section className="pt-20 pb-10 sm:grid sm:grid-cols-[96px_1fr] sm:pt-28">
        <div className="text-brand mb-3 font-mono text-xs sm:mb-0 sm:pt-2">404</div>
        <div>
          <h1 className="m-0 text-[clamp(1.6rem,1.2rem+1.6vw,2.25rem)] leading-[1.25] font-bold tracking-[-0.03em]">
            페이지를 찾을 수 없습니다.
          </h1>
          <p className="text-muted-foreground m-0 mt-4 text-[15px] leading-relaxed">
            주소가 바뀌었거나 삭제된 글일 수 있어요.{" "}
            <kbd className="rounded border px-1 font-mono text-xs">/</kbd> 를 눌러 검색해 보세요.
          </p>
          <Link
            href="/"
            className="group text-muted-foreground hover:text-foreground mt-8 inline-flex items-center gap-1.5 font-mono text-xs"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            목록으로
          </Link>
        </div>
      </section>
    </main>
  );
}
