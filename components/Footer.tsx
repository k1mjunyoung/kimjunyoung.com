export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="flex min-h-20 items-center justify-center bg-background text-[--color-text]">
      <div className="text-center">
        <small>© {year}. kimjunyoung.com.</small>
      </div>
    </footer>
  );
}
