---
layout: default
title: Querying Business Network Data
category: tasks
section: business-network
index-order: 507
sidebar: sidebars/accordion-toc0.md
excerpt: Queries are used to return data about the blockchain world-state; for example, you could write a query to return all drivers over a defined age parameter, or all drivers with a specific name.
---

# Querying business network data

>**Warning**: The status of this feature is experimental. You **must** use Hyperledger Composer v0.8 or greater (preferably 'latest') with the {{site.data.conrefs.hlf_full}} v1.0 GA runtime to use queries. We welcome feedback and comments while we continue to iteratively add query functionality. The API may change, based on the feedback received.

Queries are used to return data about the blockchain world-state; for example, you could write a query to return all drivers over a specified age, or all drivers with a specific name. The composer-rest-server component exposes named queries via the generated REST API.

Queries are an optional component of a business network definition, written in a single query file (`queries.qry`).

Note: Queries are supported by the {{site.data.conrefs.hlf_full}} v1.0, embedded and web runtimes. The query support for the embedded and web runtimes currently has limitations and is unstable. When using the {{site.data.conrefs.hlf_full}} v1.0 runtime {{site.data.conrefs.hlf_full}} must be configured to use CouchDB persistence. 

## Types of Queries

{{site.data.conrefs.composer_full}} supports two types of queries: named queries and dynamic queries. Named queries are specified in the business network definition and are exposed as GET methods by the composer-rest-server component. Dynamic queries may be constructed dynamically at runtime within a Transaction Processor function, or from client code.

## Writing Named Queries

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

### Query Parameters

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

## Using Queries

Queries can be invoked by calling the _buildQuery_ or _query_ APIs. The _buildQuery_ API requires the entire query string to be specified as part of the API input. The _query_ API requires you to specify the name of the query you wish to run.

For more information on the query APIs, see the [API documentation](../jsdoc/index.html).

## Access Control for Queries

When returning the results of a query, your access control rules are applied to the results. Any content which the current user does not have authority to view is stripped from the results.

For example, if the current user sends a query that would return all assets, if they only have authority to view a limited selection of assets, the query would return only that limited set of assets.
