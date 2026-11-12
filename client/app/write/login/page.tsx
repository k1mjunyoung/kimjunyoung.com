import type { Metadata } from "next";
import LoginForm from "@/components/write/LoginForm";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: false },
};

export default function WriteLoginPage() {
  return (
    <main className="mx-auto max-w-[880px] px-5">
      <div className="py-24 sm:grid sm:grid-cols-[96px_1fr] sm:py-32">
        <div className="text-muted-foreground mb-4 font-mono text-xs sm:mb-0 sm:pt-2">write</div>
        <div className="max-w-[360px]">
          <h1 className="m-0 text-2xl font-bold tracking-[-0.03em]">글 작성</h1>
          <p className="text-muted-foreground mt-2 mb-8 text-sm">암호를 입력하면 작성 화면으로 이동합니다.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
