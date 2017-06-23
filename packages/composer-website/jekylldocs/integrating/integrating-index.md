---
layout: default
title: Integrating Index
category: concepts
section: integrating
index-order: 0
sidebar: sidebars/integrating.md
excerpt: How to create a new Connection Profile
---

# Integrating existing systems

---

{{site.data.conrefs.composer_full}} can be integrated with existing systems by using a Loopback API. Integrating existing systems allows you to pull data from existing business systems and convert it to assets or participants in a {{site.data.conrefs.composer_short}} business network.

---

{% assign sorted = (site.pages | sort: 'index-order') %}
{% for page in sorted %}
{% if page.section == 'integrating' and page.title != "Integrating Index" %}
{% if page.status == 'experimental' %}
### {{ page.title }}
_Please note: The status of this feature is **experimental**. We welcome your feedback on the utility of this feature. While we will strive to ensure backwards compatibility this cannot be guaranteed._

{{ page.excerpt }}
{% endif %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}

---

For instructions on setting up a Loopback API, see [Generating a REST API](../integrating/getting-started-rest-api.html).
