task default: 'test'

desc 'PostgreSQL DB에서 ko/_posts/로 게시물 마이그레이션 (FORCE=1 로 덮어쓰기)'
task :migrate do
  force = ENV['FORCE'] == '1' ? '--force' : ''
  ruby "migrate_from_pg.rb #{force}".strip
end

desc 'Upsert company data from English/Japanese README'
task :upsert_data_by_readme do
  ruby "upsert_data_by_readme.rb en"
  ruby "upsert_data_by_readme.rb ja"
end

namespace :upsert_data_by_readme do
  desc 'Upsert company data from English README'
  task :en do
    ruby "upsert_data_by_readme.rb en"
  end

  desc 'Upsert company data from Japanese README'
  task :ja do
    ruby "upsert_data_by_readme.rb ja"
  end
end

task test: [:build] do
  require 'html-proofer'
  # cf. GitHub - gjtorikian/html-proofer
  # https://github.com/gjtorikian/html-proofer

  # Load custom checks
  Dir['_tests/*.rb'].each { |file| require_relative file }
  options = {
    allow_hash_href:  true,
    disable_external: true,
    checks: ['Links', 'Images', 'OpenGraph', 'Favicon', 'JsonLdCheck'],

    # NOTE: You can ignore file, URL, and response as follows
    ignore_files: [
      '_site/google3a4de0d83c05ed13.html',
    ],
    ignore_urls: [
      %r{^http://www.ahunrupar.co},
      %r{^http://kanamei.co.jp},
      %r{^http://www.unicon-ltd.com},
      %r{^/ja/グロース},
    ],
    #ignore_status_ignore: [0, 500, 999],
  }

  HTMLProofer.check_directory('_site/', options).run
end

# Enable 'build' to flush cache files via 'clean'
task build: [:clean] do
  system 'bundle exec jekyll build'
end

task :clean do
  system 'bundle exec jekyll clean'
end
