---
layout: default
title: Developing Applications
section: applications
category: start
index-order: 600
sidebar: sidebars/accordion-toc0.md
excerpt: Writing a node.js application
---

# Developing Applications


{{site.data.conrefs.composer_full}} supports creating web, mobile or native Node.js applications. It includes the `composer-rest-server` (itself based on LoopBack technology) to automatically generate a REST API for a business network, and the `hyperledger-composer` code generation plugin for the Yeoman framework to generate a skeleton Angular application.

In addition it includes a rich set of JavaScript APIs to build native Node.js applications.

---

{% assign sorted = site.pages | sort: 'index-order' %}
{% for page in sorted %}
{% if page.section == 'applications' and page.title != "Developing Applications" %}
### {{ page.title }}
{{ page.excerpt }}
{% endif %}
{% endfor %}

---

## References

* [**Yeoman Code Generator**](http://yeoman.io)
* [**Angular Framework**](https://angular.io)
