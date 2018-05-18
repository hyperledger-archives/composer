# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

module Jekyll
  module Tags
    class HighlightBlockCopy < Liquid::Block
      include Liquid::StandardFilters

      # The regular expression syntax checker. Start with the language specifier.
      # Follow that by zero or more space separated options that take one of three
      # forms: name, name=value, or name="<quoted list>"
      #
      # <quoted list> is a space-separated list of numbers
      SYNTAX = %r!^([a-zA-Z0-9.+#_-]+)((\s+\w+(=(\w+|"([0-9]+\s)*[0-9]+"))?)*)$!

      def initialize(tag_name, markup, tokens)
        super
        if markup.strip =~ SYNTAX
          @lang = Regexp.last_match(1).downcase
          @highlight_options = parse_options(Regexp.last_match(2))
        else
          raise SyntaxError, <<-eos
Syntax Error in tag 'highlight' while parsing the following markup:
  #{markup}
Valid syntax: highlight <lang> [linenos]
eos
        end
      end

      def render(context)
        prefix = context["highlighter_prefix"] || ""
        suffix = context["highlighter_suffix"] || ""
        code = super.to_s.gsub(%r!\A(\n|\r)+|(\n|\r)+\z!, "")

        is_safe = !!context.registers[:site].safe

        originalcode = String.new(code).gsub(/"/,'&quot;').gsub(/{/,'&#123;').gsub(/}/,'&#125;')

        output =
          case context.registers[:site].highlighter
          when "pygments"
            render_pygments(code, is_safe)
          when "rouge"
            render_rouge(code)
          else
            render_codehighlighter(code)
          end

        rendered_output = add_code_tag(output,originalcode)
        codeId = "cc1"

        prefix + rendered_output + suffix +    "<pre class=\"codecopy\" style=\"display:none;\" id=\"c1\">#{originalcode}</pre><button class=\"btn\" data-clipboard-target=\"#c1\">Copy to clipboard</button>"
      end

      def sanitized_opts(opts, is_safe)
        if is_safe
          Hash[[
            [:startinline, opts.fetch(:startinline, nil)],
            [:hl_lines,    opts.fetch(:hl_lines, nil)],
            [:linenos,     opts.fetch(:linenos, nil)],
            [:encoding,    opts.fetch(:encoding, "utf-8")],
            [:cssclass,    opts.fetch(:cssclass, nil)],
          ].reject { |f| f.last.nil? }]
        else
          opts
        end
      end

      private

      def parse_options(input)
        options = {}
        unless input.empty?
          # Split along 3 possible forms -- key="<quoted list>", key=value, or key
          input.scan(%r!(?:\w="[^"]*"|\w=\w|\w)+!) do |opt|
            key, value = opt.split("=")
            # If a quoted list, convert to array
            if value && value.include?("\"")
              value.delete!('"')
              value = value.split
            end
            options[key.to_sym] = value || true
          end
        end
        if options.key?(:linenos) && options[:linenos] == true
          options[:linenos] = "inline"
        end
        options
      end

      def render_pygments(code, is_safe)
        Jekyll::External.require_with_graceful_fail("pygments")

        highlighted_code = Pygments.highlight(
          code,
          :lexer   => @lang,
          :options => sanitized_opts(@highlight_options, is_safe)
        )

        if highlighted_code.nil?
          Jekyll.logger.error <<eos
There was an error highlighting your code:

#{code}

While attempting to convert the above code, Pygments.rb returned an unacceptable value.
This is usually a timeout problem solved by running `jekyll build` again.
eos
          raise ArgumentError, "Pygments.rb returned an unacceptable value "\
          "when attempting to highlight some code."
        end

        highlighted_code.sub('<div class="highlight"><pre>', "").sub("</pre></div>", "")
      end

      def render_rouge(code)
        Jekyll::External.require_with_graceful_fail("rouge")
        formatter = Rouge::Formatters::HTML.new(
          :line_numbers => @highlight_options[:linenos],
          :wrap         => false
        )
        lexer = Rouge::Lexer.find_fancy(@lang, code) || Rouge::Lexers::PlainText
        formatter.format(lexer.lex(code))
      end

      def render_codehighlighter(code)
        h(code).strip
      end

      def add_code_tag(code,original)

        code_attributes = [
          "class=\"language-#{@lang.to_s.tr("+", "-")}\"",
          "data-lang=\"#{@lang}\"",
        ].join(" ")
        "<figure class=\"highlight\"><pre><code #{code_attributes}>"\
        "#{code.chomp}</code></pre></figure> "
      end
    end
  end
end

Liquid::Template.register_tag("highlightc", Jekyll::Tags::HighlightBlockCopy)
