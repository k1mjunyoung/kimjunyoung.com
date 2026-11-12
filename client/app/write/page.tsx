import "@/styles/article.css";
import type { Metadata } from "next";
import CodeCopy from "@/components/post/CodeCopy";
import WriteEditor from "@/components/write/WriteEditor";

// 접근 제한은 middleware.ts, 저장은 app/write/actions.ts (액션마다 세션을 다시 확인), 미리보기는 브라우저(LivePreview)
export const metadata: Metadata = {
  title: "글 작성",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function WritePage() {
  return (
    <main>
      <CodeCopy />
      <WriteEditor />
    </main>
  );
}
