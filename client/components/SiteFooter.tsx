export default function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[880px] px-5 pb-16">
      <div className="text-muted-foreground mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-6 font-mono text-xs sm:ps-[96px]">
        <span>© {new Date().getFullYear()} 김준영</span>
        <span>
          <kbd className="rounded border px-1">/</kbd> 로 검색
        </span>
      </div>
    </footer>
  );
}
