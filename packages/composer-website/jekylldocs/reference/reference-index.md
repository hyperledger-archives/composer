---
layout: default
title: Reference
section: reference
index-order: 1000
sidebar: sidebars/accordion-toc0.md
excerpt: Reference section index page.
---

# Reference material for {{site.data.conrefs.composer_full}}

The {{site.data.conrefs.composer_full}} reference material contains a number of topics including reference information for the npm modules, CLI commands, modeling language, APIs, connection profiles, and a glossary of common terms.

---

{% assign sorted = site.pages | sort: 'index-order' %}
{% for page in sorted %}
{% if page.section == 'reference' and page.title != "Reference" or page.exception == 'API' %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}

---
