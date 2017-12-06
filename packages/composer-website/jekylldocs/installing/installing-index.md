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

<a href={{site.data.links.playground}}><img src='../assets/img/Install01.svg' width="30%" style="border:none !important"/></a> <a href="../installing/development-tools.html"><img src='../assets/img/Install03.svg' width="30%" style="border:none !important"/></a>

{% assign sorted = site.pages | sort: 'index-order' %}
{% for page in sorted %}
{% if page.section == 'installing' and page.title != "Installing" %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}
