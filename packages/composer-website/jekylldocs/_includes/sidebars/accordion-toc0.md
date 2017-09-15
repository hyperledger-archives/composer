{% assign sorted = site.pages | sort: 'index-order' %}
{% for page in sorted %}
{% if page.index-order %}
{% capture mods %}{{ page.index-order | modulo:100 }}{% endcapture %}
{% if mods == "0" and page.exception == nil %}
- [{{ page.title }}](..{{page.url}}.html)
{% elsif mods != "0" and page.exception == nil %}
  - [{{page.title}}](..{{page.url}}.html)
{% endif %}
{% endif %}
{% endfor %}
