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

> Note: If you're using {{site.data.conrefs.hlf_full}}  {{site.data.conrefs.hlf_latest}} or below, the `LIMIT` and `SKIP` won't work as there is an issue passing the params to couchdb from fabric. Reference to {{site.data.conrefs.hlf_full}} issue : [FAB-2809](https://jira.hyperledger.org/browse/FAB-2809)

#### Example Query

This query returns all drivers from the default registry whose age is less than the supplied parameter _or_ whose firstName is "Dan", as long as their lastName is not "Selman".

In practical terms, this query returns all drivers who do not have the lastName "Selman", as long as they are under a defined age, or have the firstName Dan, and orders the results by lastName ascending and firstName ascending.

```
query Q20{
    description: "Select all drivers younger than the supplied age parameter or who are named Dan and whose lastName is not Selman, ordered from A-Z by firstName"
    statement:
        SELECT org.example.Driver
            WHERE ((age < _$ageParam OR firstName == 'Dan') AND (lastName != 'Selman'))
                ORDER BY [lastName ASC, firstName ASC]
}
```

#### Parameters in queries

Queries can be written with undefined parameters that must be supplied when running the query. For example, the following query returns all drivers where the _age_ property is greater than the supplied parameter:

```
query Q17 {
    description: "Select all drivers aged older than PARAM"
    statement:
        SELECT org.example.Driver
            WHERE (_$ageParam < age)
}
```

#### Sample Contains queries

The `CONTAINS` filter is used to search a array field in a node. The below query returns all the drivers who earned the punctual and steady-driving badges. Considering that the badges is of array type in driver participant.


```
query Q18 {
    description: "Select all drivers who has the following interests"
    statement:
        SELECT org.example.Driver
            WHERE (badges CONTAINS ['punctual', 'steady-driving'])
}
```

#### Testing queries

If you intend to run unit test on your Queries, currently, PouchDB does not allow using testing queries that use `ORDER BY` clauses, due to issue [#3923](https://github.com/hyperledger/composer/issues/3923).

You can bypass this problem by implementing the `npm test` command in `package.json` along these lines:

```
"test": "sed -i '' -e 's,  ORDER BY,// ORDER BY,g' ./queries.qry && mocha -t 0 --recursive && sed -i '' -e 's,// ORDER BY,  ORDER BY,g' ./queries.qry"
```

This comments out all the `ORDER BY` parts before testing, and uncomments them after testing. Naturally, this will not permit testing that ordering works, but can help test the expected content of queries.

## What next?

- [Applying queries to a business network.](../business-network/query.html)
- [Emitting events from transactions.](../business-network/publishing-events.html)
- [{{site.data.conrefs.composer_full}} API documentation.](../api/api-doc-index.html)
