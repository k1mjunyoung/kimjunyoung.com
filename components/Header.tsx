import Search from "./Search";

export default function Header() {
  return (
    <div className="min-h-[200px] w-full bg-theme py-6">
      <div className="mx-auto w-[var(--container-prose)] max-w-[90%] text-title">
        <p className="mb-0 opacity-80">
          백엔드 개발자의 기술 이야기와 일상, 회고를 기록합니다.
        </p>
        <Search />
      </div>
    </div>
  );
}
