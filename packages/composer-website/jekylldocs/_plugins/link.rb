module ChangeLocalMdLinksToHtml
  class Generator < Jekyll::Generator
    def generate(site)
      site.pages.each { |p| rewrite_links(site, p) }
    end
    def rewrite_links(site, page)
      m = page.content.match /Module\*\* (.*)/
      page.content = page.content.gsub(/(\[[^\]]*\]\([^:\)]*)\.md\)/, '\1.html)')
      page.content = page.content.gsub(/\{@link (\w*)-([\w#]*) (\w*)\}/) { "[#{$3}](#{$1}-#{$2.downcase})"  }
      page.content = page.content.gsub(/\{@link (\w*)-([\w#]*)\}/) { "[#{$2}](#{$1}-#{$2.downcase})"  }
      page.content = page.content.gsub(/\{@link ([\w#]*)\}/) { "[#{$1}](#{m[1]}-#{$1.downcase})"  }
    end
  end
end