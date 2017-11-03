---
layout: default
title: Query Language
section: reference
index-order: 1004
sidebar: sidebars/accordion-toc0.md
excerpt: The [**Hyperledger Composer query language**](./query-language.html) defines queries to run and return data from business networks.
---

# {{site.data.conrefs.composer_full}} Query Language

Queries in {{site.data.conrefs.composer_full}} are written in a bespoke query language. Queries are defined in a single query file called (`queries.qry`) within a business network definition.

## Query Syntax

All queries must contain the `description` and `statement` properties.

### Description

The `description` property is a string which describes the function of the query. It must be included but can contain anything.

### Statement

The `statement` property contains the defining rules of the query, and can have the following operators:

- `SELECT` is a mandatory operator, and by default defines the registry and asset or participant type that is to be returned.
- `FROM` is an optional operator which defines a different registry to query.
- `WHERE` is an optional operator which defines the conditions to be applied to the registry data.
- `AND` is an optional operator which defines additional conditions.
- `OR` is an optional operator which defines alternative conditions.
- `CONTAINS` is an optional operator that defines conditions for array values
- `ORDER BY` is an optional operator which defines the sorting or results.
- `SKIP` is an optional operator which defines the number of results to skip.
- `LIMIT` is an optional operator which defines the maximum number of results to return from a query, by default limit is set at 25.

#### Example Query

This query returns all drivers from the default registry whose age is less than the supplied parameter _or_ whose firstName is "Dan", as long as their lastName is not "Selman".

In practical terms, this query returns all drivers who do not have the lastName "Selman", as long as they are under a defined age, or have the firstName Dan, and orders the results by lastName ascending and firstName descending.

```
query Q20{
    description: "Select all drivers younger than the supplied age parameter or who are named Dan and whose lastName is not Selman, ordered by lastname, firstname"
    statement:
        SELECT org.acme.Driver
            WHERE ((age < _$ageParam OR firstName == 'Dan') AND (lastName != 'Selman'))
                ORDER BY [lastName ASC, firstName DESC]
}
```

#### Parameters in queries

Queries can be written with undefined parameters that must be supplied when running the query. For example, the following query returns all drivers where the _age_ property is greater than the supplied parameter:

```
query Q17 {
    description: "Select all drivers aged older than PARAM"
    statement:
        SELECT org.acme.Driver
            WHERE (_$ageParam < age)
}
```

## What next?

- [Applying queries to a business network.](../business-network/query.html)
- [Emitting events from transactions.](../business-network/publishing-events.html)
- [{{site.data.conrefs.composer_full}} API documentation.](../api/api-doc-index.html)
