import Search from './Search';

export default function Header() {
  return (
    <div
      style={{
        minHeight: '200px',
        backgroundColor: 'var(--color-theme)',
        width: '100%',
        padding: '24px 0',
      }}
    >
      <div
        style={{
          width: 'var(--container-prose)',
          maxWidth: '90%',
          margin: '0 auto',
          color: 'var(--color-title)',
        }}
      >
        <h1 style={{ marginBottom: '4px', color: 'var(--color-title)' }}>개발자 준영</h1>
        <p style={{ opacity: 0.8, marginBottom: 0 }}>
          백엔드 개발자의 기술 이야기와 일상, 회고를 기록합니다.
        </p>
        <Search />
      </div>
    </div>
  );
}
