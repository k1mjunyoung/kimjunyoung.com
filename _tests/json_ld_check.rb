# frozen_string_literal: true

require 'json'

class JsonLdCheck < HTMLProofer::Check
  def run
    @html.css('script[type="application/ld+json"]').each do |script|
      check_json_ld(script)
    end
  end

  private

  def check_json_ld(script)
    json_text = script.content.strip

    # Check if JSON is valid
    begin
      JSON.parse(json_text)
    rescue JSON::ParserError => e
      add_failure("Invalid JSON-LD: #{e.message}")
    end
  end
end
