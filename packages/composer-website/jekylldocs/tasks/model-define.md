---
layout: default
title: Task - Create a Business Domain Model
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to create a business domain model
---

# Create a Business Domain Model

---

You use the CTO language to model a business domain. The language allows you to quickly and unambiguously declare to Fabric Composer the structure of your transactions, assets and participants. These can be simple, or can become very sophisticated as the CTO language allows you to import types from external namespaces, subclass types, declare relationships to types etc.

The elements of the CTO language are described in detail in the reference section of the documentation.

Fabric Composer uses your domain models for a wide variety of tasks, from ensuring that submitted transactions are valid instances, to serializing and validating your assets to/from JSON, to generating Typescript code for your user interface applications.

A Fabric Composer domain model is one or more CTO files. Each CTO file has a single namespace and contains type definitions. A set of CTO files may be managed in a project along with a `package.json` file, allowing the set of CTO files to be publish and versioned using `npm`.
