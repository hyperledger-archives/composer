---
layout: default
title: Tutorials
category: tasks
sidebar: sidebars/tutorials.md
excerpt: Tutorials
---

# Tutorial Homepage

This is a standin until tutorials are real.


{% for post in site.tutorials %}
<ul>
  <li><a href="{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a><br/><div class="excerpt">{{ post.excerpt }}</div></li>
</ul>
{% endfor %}
