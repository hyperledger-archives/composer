module ChangeLocalMdLinksToHtml
  class Generator < Jekyll::Generator
    def generate(site)
      site.pages.each { |p| rewrite_links(site, p) }
    end
    def rewrite_links(site, page)
      page.content = page.content.gsub(/(\[[^\]]*\]\([^:\)]*)\.md\)/, '\1.html)')
      page.content = page.content.gsub(/\{@link (.*)\}/,'**\1**')
    end
  end
end