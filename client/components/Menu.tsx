import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Menu() {
  return (
    <nav className="bg-theme-lighter sticky top-0 z-10 w-full overflow-hidden">
      <div className="mx-auto flex h-20 w-full max-w-3xl items-center justify-between px-4 md:px-0">
        <Link
          href="/"
          className="text-title flex items-center no-underline hover:no-underline"
        >
          <span className="font-display text-2xl font-bold">kimjunyoung</span>
        </Link>
        <ul className="m-0 flex items-center gap-5 p-0">
          <li>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-title gap-1.5 text-sm opacity-90 hover:bg-white/10 hover:opacity-100"
            >
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bi bi-github" />
                GitHub
              </a>
            </Button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
