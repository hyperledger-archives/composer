module Jekyll
  class CodeIdTag < Liquid::Tag

    def initialize(tag_name, text, tokens)
      super
      @text = text
    end

    def render(context)
      "<button class=\"btn\" data-clipboard-text=\"  #{@text}  \">Copy to clipboard</button>"
    end
  end
end

Liquid::Template.register_tag('code_id', Jekyll::CodeIdTag)
