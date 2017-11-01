---
layout: default
title: Historian
section: reference
index-order:
sidebar: sidebars/accordion-toc0.md
excerpt: The Hyperledger Composer Historian provides a registry that contains information about historical transactions
---

# {{site.data.conrefs.composer_full}} Historian

>**Warning**: This is the first part of the implementation of functionality to track the transactions and asset updates. There are additional use cases that are not a covered by this implementation. Details are being tracked in GitHub issue 55. There may be changes to the HistorianRecord (documented below) as a result.

The Historian is a registry populated with `HistorianRecords` that contains information about historical transactions.  When a transaction is submitted, the `HistorianRecord` is updated, and over time, maintains a history of transactions within a business network, and the participants and identities involved in submitting those transactions. Historian records can be queried using Composer Queries to extract specific records or data. An example would be tracking the lifecycle of an asset such as a Land Title, from creation (with a Land Title ID) through update, through ownership changes carried out by different identities and/or participants. The transactions associated with this example can be queried in Historian, say, over a given time period.

## Historian Record

A `HistorianRecord` is an 'asset' defined in the {{site.data.conrefs.composer_full}} system namespace. `HistorianRecord`s are defined as follows.

```
asset HistorianRecord identified by transactionId {
  o String      transactionId
  o String      transactionType
  --> Transaction transactionInvoked
  --> Participant participantInvoking  optional
  --> Identity    identityUsed         optional
  o Event[]       eventsEmitted        optional
  o DateTime      transactionTimestamp
}
```

 * `String transactionId` Using the transaction id as the uuid
 * `String transactionType` Type of the transaction that was submitted
 * `Transaction transactionInvoked` Relationship to transaction
 * `Participant participantInvoking` Participant who invoked this transaction
 * `Identity identityUsed` The identity that was used by the participant
 * `Event[] eventsEmitted` The events that where emitted by this transactionId
 * `DateTime transactionTimestamp` Use the transaction's timestamp

It's important to note that the Transaction, Participant and Identity are relationships. Applications that wish to obtain these attributes must resolve this relationship.

## Tracking Transactions

The historian registry is updated for each successful transaction, transactions which fail are not recorded. In addition, several operations that the {{site.data.conrefs.composer_full}} runtime makes are classed as transactions. These 'system transactions' are defined in the {{site.data.conrefs.composer_full}} system model. The following will add historian records.

 * Add, Remove and Update of Assets
 * Add, Remove and Update of Participants
 * Issue, Bind, Activate and Revoke of Identities

Note that the retrieval of assets and participants is not tracked.

## Querying the Historian

The established APIs for querying and working with resources and relationship are applicable. The historian is a registry containing assets (HistorianRecords) so can be queried.

For example to get all the Historian records a typical promise chain would be as follows.

```
    .then(() => {       
        return businessNetworkConnection.getHistorian();
    }).then((historian) => {
        return historian.getAll();
    }).then((historianRecords) => {        
        console.log(prettyoutput(historianRecords));
    })
```

As this is a 'getAll' call it will potentially return high volume of data. Therefore the query capability is vital in being able to select a subset of records. A typical example would be to select records based on a time. This uses the query capability to select records where the transaction timestamp is past a certain point. The returned records can be processed in exactly the same way.

```
  let now = new Date();
  now.setMinutes(10);  // set the date to be time you want to query from

  let q1 = businessNetworkConnection.buildQuery('SELECT org.hyperledger.composer.system.HistorianRecord ' +
                                                'WHERE (transactionTimestamp > _$justnow)');   

  return businessNetworkConnection.query(q1,{justnow:now});
```

More advanced queries can be used; for example, the following query selects and returns the Add, Update, and Remove asset system transactions.

```
  // build the special query for historian records
  let q1 = businessNetworkConnection.buildQuery(
      `SELECT org.hyperledger.composer.system.HistorianRecord
          WHERE (transactionType == 'AddAsset' OR transactionType == 'UpdateAsset' OR transactionType == 'RemoveAsset')`
  );      

  return businessNetworkConnection.query(q1);

```



## What next?

- [Applying queries to a business network.](../business-network/query.html)
- [Emitting events from transactions.](../business-network/publishing-events.html)
- [{{site.data.conrefs.composer_full}} API documentation.](../api/api-doc-index.html)
