---
layout: default
title: Publish Models or Business Network Definitions
category: tasks
section: business-network
index-order: 506
sidebar: sidebars/accordion-toc0.md
excerpt: How to publish a model or business network definition for use by applications
---

# Publish Models or Business Network Definitions for use by applications


{{site.data.conrefs.composer_full}} can optionally use the `npm` package manager to publish both business networks, and models. By publishing business networks to `npm` applications that need to reference the business networks (for example to introspect them, or deploy them) can declare a binary package dependency on the published `npm` package. Using _semantic versioning_ of the npm package for the business network also allows applications to specify their tolerance for accepting incompatible changes to the business network.

The `npm` package manager is a powerful (Internet scale) mechanism to distribute any binaries, along with metadata expressed in a `package.json` file.

Similarly, a set of {{site.data.conrefs.composer_short}} domain models (CTO files) may be packaged into an `npm` package for publication. The ability to publish models allows the models to be reused across multiple business networks (by declaring a `package.json` dependency), as well as ensures that semantic versioning can be used to control the evolution of the models themselves.

However, publication to `npm` is not required to use {{site.data.conrefs.composer_short}}. You may bundle a business network inside an application, and simply manage its source files using version control software, such as git.

The easiest way to publish a model or business network definition for use by applications it to push the business network definition to the `npm` package manager using the `npm publish` command. This will allow the applications that would like to use the business network definition (for example to deploy it via API) to reference the business network definition as a dependency in their `package.json` file.

## References

* [**Example business network published to npm**](https://www.npmjs.com/package/perishable-network)
* [**Example model published to npm**](https://www.npmjs.com/package/animaltracking-model)
