{% assign sorted = site.pages | sort: 'index-order' %}
{% for page in sorted %}
{% if page.index-order %}
{% capture mods %}{{ page.index-order | modulo:100 }}{% endcapture %}
{% if mods == "0" %}
- [{{ page.title }}]({{site.url}}{{page.url}}.html)
{% elsif mods != "0" %}
  - [{{page.title}}]({{site.url}}{{page.url}}.html)
{% endif %}
{% endif %}
{% endfor %}
