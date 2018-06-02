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
      mdnprefix = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/"
      page.content = page.content.gsub(/\{(?:@link )?(object|string|map|promise|boolean|buffer)(?:\[\])?\s*\}/i) {"[#{$1}]("+mdnprefix+"#{$1})"}

      # Converts any Markdown link using .md suffix to a .html suffix
      page.content = page.content.gsub(/(\[[^\]]*\]\([^:\)]*)\.md\)/, '\1.html)')

      # Special cases to copy with difference approaches to the {@link xxxx} tag      
      page.content = page.content.gsub(/\{@link (#[\w]*) ([\w\s]*)\}/) { "[#{$2}](#{$1.downcase})"  }
      page.content = page.content.gsub(/\{@link (#[\w]*)\}/) { "[#{$1}](#{$1.downcase})"  }
      page.content = page.content.gsub(/\{@link (\w*)[.-]([\w#]*) ([\w\s]*)\}/) { "[#{$3}](#{$1}-#{$2.downcase})"  }
      page.content = page.content.gsub(/\{@link (?:module:)?(?:composer-)?(\w*)[.-]([\w#]*)\}/) { "[#{$2}](#{$1}-#{$2.downcase})"  }
      page.content = page.content.gsub(/\{@link ([\w#]*)(?:\[\])?\}/) { "[#{$1}]("+modulename+"-#{$1.downcase})"  }
      page.content = page.content.gsub(/\{@link ([\w#]*) ([\w\s]*)\}/) { "[#{$2}]("+modulename+"-#{$1.downcase})"  }
      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?(\w*)[.-]([\w#]*) ([\w\s]*)\}/) { "[#{$3}](#{$1}-#{$2.downcase})"  }

# Candidate extra regexp to cope with more cases of links... not yet fully tested     
      # page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?(#[\w]*) (\w*)\}/) { "[#{$2}](#{$1.downcase})"  }
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?(#[\w]*)\}/) { "[#{$1}](#{$1.downcase})"  }
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?(\w*)[.-]([\w#]*)\}/) { "[#{$2}](#{$1}-#{$2.downcase})"  }
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?([\w#]*)\}/) { "[#{$1}]("+modulename+"-#{$1.downcase})"  }
#      page.content = page.content.gsub(/\{(?:@link )?(?:module:)?(?:composer-)?([\w#]*) (\w*)\}/) { "[#{$2}]("+modulename+"-#{$1.downcase})"  }

    end
  end
end