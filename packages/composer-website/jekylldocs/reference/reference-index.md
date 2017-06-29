---
layout: default
title: Reference Index
section: reference
index-order: 0
sidebar: sidebars/reference.md
excerpt: Reference section index page.
---

# Reference material for {{site.data.conrefs.composer_full}}

The {{site.data.conrefs.composer_full}} reference material contains a number of topics including reference information for the npm modules, CLI commands, modeling language, APIs, connection profiles, and a glossary of common terms.

---

{% assign sorted = site.pages | sort: 'index-order' %}
{% for page in sorted %}
{% if page.section == 'reference' and page.title != "Reference Index" %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}

---
