---
layout: default
title: Installing Index
category: tasks
sidebar: sidebars/getting-started.md
section: installing
excerpt: Tutorials
---

# Installing {{site.data.conrefs.composer_full}}

---

## Installation options

Installing {{site.data.conrefs.composer_full}} is simple. You can get started using the Playground online without any installation, install the playground locally with an instance of {{site.data.conrefs.hlf_full}}, or get setup up with development tools for working on the command line.

{% assign sorted = (site.pages | sort: 'index-order') %}
{% for page in sorted %}
{% if page.section == 'installing' and page.title != "Installing Index" %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}

## What next?

* [**Begin defining your business network**](../business-network/businessnetwork.html)
* [**Integrate existing data with Loopback**](../integrating/getting-started-rest-api.html).
* [**Manage user permissions and identities**](../managing/managingindex.html).
