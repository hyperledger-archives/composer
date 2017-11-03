---
layout: default
title: Using Queries and Filters with Business Network Data
category: tasks
section: business-network
index-order: 507
sidebar: sidebars/accordion-toc0.md
excerpt: Queries are used to return data about the blockchain world-state; for example, you could write a query to return all drivers over a defined age parameter, or all drivers with a specific name.
---

# Querying and filtering business network data

Queries are used to return data about the blockchain world-state; for example, you could write a query to return all drivers over a specified age, or all drivers with a specific name. The `composer-rest-server` component exposes named queries via the generated REST API.

Queries are an optional component of a business network definition, written in a single query file (`queries.qry`).

Note: When using the {{site.data.conrefs.hlf_full}} v1.0 runtime {{site.data.conrefs.hlf_full}} must be configured to use CouchDB persistence.

Filters are similar to queries, but use the LoopBack filter syntax, and can only be sent using the {{site.data.conrefs.composer_full}} REST API. Currently, only the `WHERE` LoopBack filter is supported. The supported operators within `WHERE` are: **=**, **and**, **or**, **gt**, **gte**, **lt**, **lte**, **neq**. Filters are submitted using a `GET` call against an asset type, participant type, or transaction type; the filter is then supplied as a parameter. Filters return the results from the specified class, and will not return results from classes extending the specified class.

## Types of Queries

{{site.data.conrefs.composer_full}} supports two types of queries: named queries and dynamic queries. Named queries are specified in the business network definition and are exposed as GET methods by the composer-rest-server component. Dynamic queries may be constructed dynamically at runtime within a Transaction Processor function, or from client code.

### Writing Named Queries

Queries must contain a description and a statement. Query descriptions are a string that describe the function of the query. Query statements contain the operators and functions that control the query behavior.

Query descriptions can be any descriptive string. A query statement must include the `SELECT` operator and can optionally include `FROM`, `WHERE`, `AND`, `ORDER BY`, `SKIP`, and `LIMIT`.

Queries should take the following format:

```
query Q1{
  description: "Select all drivers older than 65."
  statement:
      SELECT org.acme.Driver
          WHERE (age>65)
}
```

#### Query Parameters

Queries may embed parameters using the `_$` syntax. Note that query parameters must be primitive types (String, Integer, Double, Long, Boolean, DateTime), a Relationship or an Enumeration.

The named query below is defined in terms of 3 parameters:

```
query Q18 {
    description: "Select all drivers aged older than PARAM"
    statement:
        SELECT org.acme.Driver
            WHERE (_$ageParam < age)
                ORDER BY [lastName ASC, firstName DESC]
                    LIMIT _$limitParam
                        SKIP _$skipParam
}
```

Query parameters are automatically exposed via the GET method created for named queries by the composer-rest-server.

For more information on the specifics of the {{site.data.conrefs.composer_full}} query language, see the [query language reference documentation](../reference/query-language.html).

### Queries using the API

Queries can be invoked by calling the _buildQuery_ or _query_ APIs. The _buildQuery_ API requires the entire query string to be specified as part of the API input. The _query_ API requires you to specify the name of the query you wish to run.

For more information on the query APIs, see the [API documentation](../api/api-doc-index.html).

### Access Control for Queries

When returning the results of a query, your access control rules are applied to the results. Any content which the current user does not have authority to view is stripped from the results.

For example, if the current user sends a query that would return all assets, if they only have authority to view a limited selection of assets, the query would return only that limited set of assets.

## Using filters

Filters can only be submitted using the {{site.data.conrefs.composer_full}} REST API, and must use the [LoopBack syntax](https://loopback.io/doc/en/lb2/Where-filter.html). To submit a query, a **GET** REST call must be submitted against an asset type, participant type, or transaction type with the filter supplied as a parameter. The supported data types for parameters to be filtered are _numbers_, _Boolean_, _DateTime_, and _strings_. A basic filter takes the following format, where `op` indicates an operator:

```
{"where": {"field1": {"op":"value1"}}}
```

*Please note*: Only the top level `WHERE` operator can have more than two operands.

Currently, only the `WHERE` LoopBack filter is supported. The supported operators within `WHERE` are: **=**, **and**, **or**, **gt**, **gte**, **lt**, **lte**, **neq**. Filters can combine multiple operators, in the following example, an **and** operator is nested within an **or** operator.

```
{"where":{"or":[{"and":[{"field1":"foo"},{"field2":"bar"}]},{"field3":"foobar"}]}}
```

The **between** operator returns values between the given range. It accepts numbers, datetime values, and strings. If supplied with strings, the **between** operator returns results between the supplied strings alphabetically. In the example below, the filter will return all resources where the driver property is alphabetically between _a_ and _c_, inclusively.

```
{"where":{"driver":{"between": ["a","c"]}}}
```
