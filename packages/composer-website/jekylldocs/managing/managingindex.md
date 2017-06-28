---
layout: default
title: Managing Index
category: concepts
section: managing
index-order: 0
sidebar: sidebars/managing.md
excerpt: "Managing your {{site.data.conrefs.composer_full}}"
---

# Managing your {{site.data.conrefs.composer_full}} Solution

{% assign sorted = (site.pages | sort: 'index-order') %}
{% for page in sorted %}
{% if page.section == 'managing' and page.title != "Managing Index" %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}

---

## What next?

* You might want to [**integrate your existing systems**](../integrating/integrating-index.html) with {{site.data.conrefs.composer_full}} using LoopBack.
* Applications which consume data from your business network can [**subscribe to events**](../applications/subscribing-to-events.html).
