module ChangeLocalMdLinksToHtml
  class Generator < Jekyll::Generator
    def generate(site)
      site.pages.each { |p| rewrite_links(site, p) }
    end
    def rewrite_links(site, page)
      m = page.content.match /Module\*\* (.*)/
      if m 
        modulename = m[1]
      else
        modulename = "none"
      end
      page.content = page.content.gsub(/(\[[^\]]*\]\([^:\)]*)\.md\)/, '\1.html)')
      page.content = page.content.gsub(/\{@link (#[\w]*) (\w*)\}/) { "[#{$2}](#{$1.downcase})"  }
      page.content = page.content.gsub(/\{@link (#[\w]*)\}/) { "[#{$1}](#{$1.downcase})"  }
      page.content = page.content.gsub(/\{@link (\w*)-([\w#]*) (\w*)\}/) { "[#{$3}](#{$1}-#{$2.downcase})"  }
      page.content = page.content.gsub(/\{@link (\w*)-([\w#]*)\}/) { "[#{$2}](#{$1}-#{$2.downcase})"  }
      page.content = page.content.gsub(/\{@link ([\w#]*)\}/) { "[#{$1}]("+modulename+"-#{$1.downcase})"  }
      page.content = page.content.gsub(/\{@link ([\w#]*) (\w*)\}/) { "[#{$2}]("+modulename+"-#{$1.downcase})"  }

# Candidate extra regexp to cope with more cases of links... not yet fully tested     
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?(#[\w]*) (\w*)\}/) { "[#{$2}](#{$1.downcase})"  }
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?(#[\w]*)\}/) { "[#{$1}](#{$1.downcase})"  }
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?(\w*)[.-]([\w#]*) (\w*)\}/) { "[#{$3}](#{$1}-#{$2.downcase})"  }
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?(\w*)[.-]([\w#]*)\}/) { "[#{$2}](#{$1}-#{$2.downcase})"  }
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?([\w#]*)\}/) { "[#{$1}]("+modulename+"-#{$1.downcase})"  }
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?([\w#]*) (\w*)\}/) { "[#{$2}]("+modulename+"-#{$1.downcase})"  }

    end
  end
end