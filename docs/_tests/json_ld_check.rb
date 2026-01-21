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

    # Check based on type
    case data['@type']
    when 'Organization'
      check_organization(data)
    when 'WebSite'
      check_website(data)
    end
  end

  def check_organization(data)
    # Check required properties
    check_required_property(data, '@context', 'https://schema.org')
    check_required_property(data, '@type', 'Organization')
    check_required_property(data, 'name')
    check_required_property(data, 'url')
    check_required_property(data, 'description')

    # Check address structure
    check_address_structure(data)
  end

  def check_website(data)
    # Check required properties
    check_required_property(data, '@context', 'https://schema.org')
    check_required_property(data, '@type', 'WebSite')
    check_required_property(data, 'name')
    check_required_property(data, 'url')
    check_required_property(data, 'description')
    check_required_property(data, 'inLanguage')

    # Check inLanguage is an array
    unless data['inLanguage'].is_a?(Array)
      add_failure("Property 'inLanguage' should be an array")
    end
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
