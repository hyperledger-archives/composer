---
layout: default
title: Managing Index
category: concepts
sidebar: sidebars/managing.md
excerpt: Managing your {{site.data.conrefs.composer_full}}
---

# Managing your {{site.data.conrefs.composer_full}} Solution

---

Operating a business network may require management tasks, for information on how to add participants, issue or revoke identities, enable OAuth authentication, and enabling access control, see the following topics.

{% for page in site.managing %}
  {% unless page.title == "Managing Index" %}
    {{ page.title }}
    {{ page.excerpt }}
  {% endunless %}
{% endfor %}


* [What are participants and identities](../managing/participantsandidentities.html)
* [Adding a participant](../managing/participant-add.html)
* [Issuing an identity](../managing/identity-issue.html)
* [Revoking an identity](../managing/identity-revoke.html)
* [Enabling OAuth with GitHub](../managing/github-oauth.html)
* [Enabling access control as a set participant](current-participant.html)
