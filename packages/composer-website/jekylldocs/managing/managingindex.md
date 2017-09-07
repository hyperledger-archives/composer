---
layout: default
title: Managing a Deployed Business Network
category: concepts
section: managing
index-order: 800
sidebar: sidebars/accordion-toc0.md
excerpt: "Managing your {{site.data.conrefs.composer_full}}"
---

# Managing your {{site.data.conrefs.composer_full}} Solution

{% assign sorted = site.pages | sort: 'index-order' %}
{% for page in sorted %}
{% if page.section == 'managing' and page.title != "Managing a Deployed Business Network" %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}

---

## What next?

* You might want to [**integrate your existing systems**](../integrating/integrating-index.html) with {{site.data.conrefs.composer_full}} using LoopBack.
* Applications which consume data from your business network can [**subscribe to events**](../applications/subscribing-to-events.html).
