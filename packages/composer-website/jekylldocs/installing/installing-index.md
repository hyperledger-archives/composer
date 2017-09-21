---
layout: default
title: Installing
category: tasks
sidebar: sidebars/accordion-toc0.md
section: installing
index-order: 200
excerpt: Tutorials
---

# Installing {{site.data.conrefs.composer_full}}

<a href="../installing/getting-started-with-playground.html"><img src='../assets/img/Install01.svg' width="30%"/></a> <a href="../installing/using-playground-locally.html"><img src='../assets/img/Install02.svg' width="30%"/></a> <a href="../installing/development-tools.html"><img src='../assets/img/Install03.svg' width="30%"/></a>

{% assign sorted = site.pages | sort: 'index-order' %}
{% for page in sorted %}
{% if page.section == 'installing' and page.title != "Installing" %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}

## What next?

* [**Learn about key concepts**](../introduction/key-concepts.html)
* [**View solution architecture**](../introduction/solution-architecture.html)
