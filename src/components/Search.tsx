'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Input } from '@/components/ui/input';

interface SearchItem {
  title: string;
  url: string;
  description: string;
  full_remote?: string;
  ja_required?: string;
}

const PLACEHOLDERS = [
  'Java', 'Spring', 'JPA', 'Security', 'JWT', 'TDD',
  'Docker', 'Python', 'TypeScript', 'React', 'AWS', 'Ruby',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length; i > 1; i--) {
    const j = Math.floor(Math.random() * i);
    [a[j], a[i - 1]] = [a[i - 1], a[j]];
  }
  return a;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text: string, query: string, maxLen = 100): string {
  if (!query) return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  const re = new RegExp(escapeRe(query), 'i');
  const m = re.exec(text);
  if (!m) return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  const mid = m.index;
  let start = Math.max(0, mid - Math.floor(maxLen / 2));
  let end = start + maxLen;
  if (end > text.length) { end = text.length; start = Math.max(0, end - maxLen); }
  let sliced = text.slice(start, end);
  sliced = sliced.replace(new RegExp(escapeRe(query), 'gi'), '<mark>$&</mark>');
  if (start > 0) sliced = '...' + sliced;
  if (end < text.length) sliced += '...';
  return sliced;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = shuffle(PLACEHOLDERS);
    setPlaceholder(`검색: ${p[0]}, ${p[1]}, ${p[2]}`);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(data, {
        keys: ['title', 'description', 'full_remote'],
        includeMatches: true,
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [data]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 50);
  }, [fuse, query]);

  async function loadData() {
    if (data.length > 0) return;
    const res = await fetch('/search-ko.json');
    if (res.ok) setData(await res.json());
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          marginTop: '20px',
          borderRadius: '4px',
          overflow: 'hidden',
          width: '100%',
          opacity: open ? 1 : 0.5,
          transition: '0.3s',
          boxShadow: open ? '0 0 20px 1px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <span style={{ display: 'flex', margin: '10px', opacity: open ? 1 : 0.5 }}>
          <i className="bi bi-search" />
        </span>
        <Input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setOpen(true); loadData(); }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="h-[60px] rounded-none border-none bg-transparent text-base shadow-none focus-visible:ring-0 focus-visible:border-transparent px-0"
        />
      </div>

      {open && query.trim() && (
        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--color-background)',
            zIndex: 9,
            position: 'absolute',
            top: '80px',
            left: 0,
            borderRadius: '4px',
          }}
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {results.length === 0 ? (
              <li style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                검색 결과가 없습니다.
              </li>
            ) : (
              results.map((r) => {
                const desc = highlight(r.item.description, query);
                const fr = r.item.full_remote
                  ? highlight(r.item.full_remote, query)
                  : '';
                return (
                  <li
                    key={r.item.url}
                    className="search-result-item"
                    style={{
                      borderBottom: '1px solid #ddd',
                      borderLeft: '1px solid #ddd',
                      borderRight: '1px solid #ddd',
                      padding: '10px',
                    }}
                  >
                    <a href={r.item.url}>{r.item.title}</a>{' '}
                    <small>
                      <a
                        href={r.item.url}
                        style={{ fontSize: 'smaller', textDecoration: 'none' }}
                      >
                        <span dangerouslySetInnerHTML={{ __html: desc }} />{' '}
                        {fr && <span dangerouslySetInnerHTML={{ __html: fr }} />}
                      </a>
                    </small>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
