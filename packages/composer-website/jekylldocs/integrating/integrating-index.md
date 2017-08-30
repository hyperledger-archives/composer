---
layout: default
title: Integrating Existing Systems
category: concepts
section: integrating
index-order: 700
sidebar: sidebars/accordion-toc0.md
excerpt: How to create a new Connection Profile
---

# Integrating existing systems

{{site.data.conrefs.composer_full}} can be integrated with existing systems by using a Loopback API. Integrating existing systems allows you to pull data from existing business systems and convert it to assets or participants in a {{site.data.conrefs.composer_short}} business network.

---

{% assign sorted = site.pages | sort: 'index-order' %}
{% for page in sorted %}
{% if page.section == 'integrating' and page.title != "Integrating Existing Systems" %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}

---

For instructions on setting up a Loopback API, see [Generating a REST API](../integrating/getting-started-rest-api.html).
