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

    # Check if JSON can be parsed
    begin
      data = JSON.parse(json_text)
    rescue JSON::ParserError => e
      return add_failure("Invalid JSON-LD: #{e.message}")
    end

    # Only check Organization type (skip if not Organization)
    return unless data['@type'] == 'Organization'

    # Check required properties
    check_required_property(data, '@context', 'https://schema.org')
    check_required_property(data, '@type', 'Organization')
    check_required_property(data, 'name')
    check_required_property(data, 'url')
    check_required_property(data, 'description')

    # Check address structure
    check_address_structure(data)
  end

  def check_required_property(data, property, expected_value = nil)
    unless data.key?(property)
      return add_failure("Missing required property: #{property}")
    end

    if expected_value && data[property] != expected_value
      add_failure("Property '#{property}' should be '#{expected_value}', got '#{data[property]}'")
    end
  end

  def check_address_structure(data)
    return unless data.key?('address')

    address = data['address']
    unless address.is_a?(Hash)
      return add_failure("Property 'address' should be an object")
    end

    unless address['@type'] == 'PostalAddress'
      add_failure("address/@type should be 'PostalAddress', got '#{address['@type']}'")
    end

    unless address['addressCountry'] == 'JP'
      add_failure("address/addressCountry should be 'JP', got '#{address['addressCountry']}'")
    end
  end
end
