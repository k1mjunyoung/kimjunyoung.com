export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-background flex min-h-20 items-center justify-center text-muted-foreground md:mx-auto md:max-w-3xl">
      <div className="text-center">
        <small>© {year}. kimjunyoung.com.</small>
      </div>
    </footer>
  );
}
