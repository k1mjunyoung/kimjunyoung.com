export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        minHeight: '80px',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
      }}
      className="flex items-center justify-center"
    >
      <div className="text-center">
        <small>© {year}. kimjunyoung.com.</small>
      </div>
    </footer>
  );
}
