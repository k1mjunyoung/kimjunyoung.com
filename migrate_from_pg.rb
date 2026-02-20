# frozen_string_literal: true

# migrate_from_pg.rb
# PostgreSQL DB의 post 테이블에서 ko/_posts/ 디렉토리로 게시물을 마이그레이션한다.
#
# 사용법:
#   bundle exec ruby migrate_from_pg.rb [--force]
#   bundle exec rake migrate [-- --force]
#
# 환경 변수 (기본값 있음):
#   PG_HOST, PG_PORT, PG_DBNAME, PG_USER, PG_PASSWORD

require 'pg'
require 'reverse_markdown'
require 'date'
require 'fileutils'

FORCE_OVERWRITE = ARGV.include?('--force') || ENV['FORCE'] == '1'
OUTPUT_DIR      = File.join(__dir__, 'ko', '_posts')

# ---------- 1. DB 연결 ----------

conn = PG.connect(
  host:     ENV.fetch('PG_HOST',     'localhost'),
  port:     ENV.fetch('PG_PORT',     '5432').to_i,
  dbname:   ENV.fetch('PG_DBNAME',   'railway'),
  user:     ENV.fetch('PG_USER',     'postgres'),
  password: ENV.fetch('PG_PASSWORD', 'postgres')
)

puts "DB 연결 성공: #{ENV.fetch('PG_DBNAME', 'railway')}@#{ENV.fetch('PG_HOST', 'localhost')}"

# ---------- 2. 컬럼 목록 조회 ----------

col_res = conn.exec(<<~SQL)
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'post'
  ORDER BY ordinal_position
SQL

columns = col_res.map { |r| r['column_name'] }
puts "\npost 테이블 컬럼 목록:"
col_res.each { |r| puts "  #{r['column_name'].ljust(25)} #{r['data_type']}" }
puts

# ---------- 3. 컬럼 자동 매핑 ----------

def detect_column(columns, *candidates)
  candidates.find { |c| columns.include?(c) }
end

TITLE_COL       = detect_column(columns, 'title',       'subject',     'name')
CONTENT_COL     = detect_column(columns, 'content',     'body',        'text',        'markdown')
DESCRIPTION_COL = detect_column(columns, 'description', 'summary',     'excerpt')
SLUG_COL        = detect_column(columns, 'slug',        'url_key',     'path')
DATE_COL        = detect_column(columns, 'createdAt',   'created_at',  'publishedAt', 'date')
CATEGORY_COL    = detect_column(columns, 'category',    'categories',  'tag',         'tags')

puts "컬럼 매핑 결과:"
puts "  title       → #{TITLE_COL       || '(없음)'}"
puts "  content     → #{CONTENT_COL     || '(없음)'}"
puts "  description → #{DESCRIPTION_COL || '(없음)'}"
puts "  slug        → #{SLUG_COL        || '(없음)'}"
puts "  date        → #{DATE_COL        || '(없음)'}"
puts "  categories  → #{CATEGORY_COL    || '(없음)'}"
puts

unless TITLE_COL && CONTENT_COL && DATE_COL
  abort "오류: title / content / date 중 하나 이상의 컬럼을 감지하지 못했습니다. 스크립트 상단의 감지 패턴을 확인하세요."
end

# ---------- 4. HTML 여부 감지 ----------

sample_res = conn.exec(<<~SQL)
  SELECT #{CONTENT_COL}
  FROM post
  WHERE "deleted_at" IS NULL
  ORDER BY "#{DATE_COL}" ASC
  LIMIT 3
SQL

html_like = sample_res.any? do |r|
  body = r[CONTENT_COL].to_s
  body.match?(/<\s*[a-zA-Z][^>]*>/)
end

puts "콘텐츠 형식 감지: #{html_like ? 'HTML (reverse_markdown으로 변환 예정)' : 'Markdown (그대로 사용)'}"
puts

# ---------- 5. 게시물 조회 ----------

posts_res = conn.exec(<<~SQL)
  SELECT *
  FROM post
  WHERE "deleted_at" IS NULL
  ORDER BY "#{DATE_COL}" ASC
SQL

puts "마이그레이션 대상: #{posts_res.ntuples}건"
puts

FileUtils.mkdir_p(OUTPUT_DIR)

created = 0
skipped = 0
errored = 0

posts_res.each do |row|
  # --- 필드 추출 ---
  title       = row[TITLE_COL].to_s.strip
  raw_content = row[CONTENT_COL].to_s
  description = DESCRIPTION_COL ? row[DESCRIPTION_COL].to_s.strip : ''
  slug        = SLUG_COL ? row[SLUG_COL].to_s.strip : ''
  categories  = CATEGORY_COL ? row[CATEGORY_COL].to_s.strip : ''

  # slug 없으면 title에서 생성
  if slug.empty?
    slug = title.downcase
                .gsub(/[^\w\s-]/, '')
                .gsub(/\s+/, '-')
                .gsub(/-+/, '-')
                .strip
  end

  # --- 날짜 파싱 ---
  begin
    date = DateTime.parse(row[DATE_COL].to_s)
  rescue ArgumentError, TypeError
    date = DateTime.now
  end

  date_str     = date.strftime('%Y-%m-%d')
  date_full    = date.strftime('%Y-%m-%d %H:%M:%S +0900')

  # --- 파일명 ---
  filename = "#{date_str}-#{slug}.md"
  filepath = File.join(OUTPUT_DIR, filename)

  # --- 중복 처리 ---
  if File.exist?(filepath) && !FORCE_OVERWRITE
    puts "  SKIP  #{filename}"
    skipped += 1
    next
  end

  # --- 콘텐츠 변환 ---
  begin
    content = if html_like
                ReverseMarkdown.convert(raw_content, unknown_tags: :bypass)
              else
                raw_content
              end
  rescue StandardError => e
    puts "  ERROR #{filename}: 변환 실패 — #{e.message}"
    errored += 1
    next
  end

  # --- front matter 생성 ---
  # description에 작은따옴표가 포함된 경우 이스케이프
  safe_description = description.gsub("'", "''")

  front_matter = <<~YAML
    ---
    layout: post
    lang: ko
    permalink: /ko/#{slug}
    commit_url:
    date: #{date_full}
    link:
    domain:
    title: #{title}
    description: '#{safe_description}'
    categories: #{categories}
    redirect_from:
      - /ko/#{slug}
    ---
  YAML

  # --- 파일 쓰기 ---
  begin
    File.write(filepath, front_matter + "\n" + content.lstrip, encoding: 'UTF-8')
    puts "  CREATE #{filename}"
    created += 1
  rescue StandardError => e
    puts "  ERROR #{filename}: 쓰기 실패 — #{e.message}"
    errored += 1
  end
end

conn.close

puts
puts "마이그레이션 완료: #{created}건 생성, #{skipped}건 건너뜀, #{errored}건 오류"
