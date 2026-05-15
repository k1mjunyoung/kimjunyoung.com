import Search from "./Search";

export default function Header() {
  return (
    <div className="bg-theme w-full py-6">
      <div className="text-title mx-auto w-full max-w-3xl px-4 md:px-0">
        <p className="mb-0 opacity-80">
          백엔드 개발자의 기술 이야기와 일상, 회고를 기록합니다.
        </p>
        <Search />
      </div>
    </div>
  );
}
