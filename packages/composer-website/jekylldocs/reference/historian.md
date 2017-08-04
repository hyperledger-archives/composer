---
layout: default
title: Historian
section: reference
index-order: 911
sidebar: sidebars/accordion-toc0.md
excerpt: The Hyperledger Composer Historian provides a registry retain information about previous transactions
---

# {{site.data.conrefs.composer_full}} Historian

>**Warning**: This is the first part of the implementation of functionality to track the transactions and asset updates. There are additional use cases that 
are not a covered by this current implementation. Details are being tracking in GitHub issue 55. There may be changes to the HistorianRecord (documented below) as a result.

The Historian is a registry that is populated with `HistorianRecords` when a transaction is submitted. This allows history to be queried and maintained of changes to the assets in a business network, and which participants and identities are invovled

## Historian Record

The `HistorianRecord` is defined in the Composer System model. The definition of this is using the asset modelling language. 

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

Important points to note are tha the Transaction, Participant and Identity are relationships. Applications that wish to obtain these will then need to resolve this relationship themself. At this point ACLs might prevent you from accessing these. 

## Transactions that are tracked

For all succesful transactions, the Historian registry is updated - note only succesful.  All transactions defined on a Business Network are tracked. In addition several operations that the Composer runtime makes are classed as transactions so will add HistorianRecords. These 'system transactions' are defined in the Composer system model.

 * Add, Remove and Update of Assets
 * Add, Remove and Update of Participants
 * Issue, Bind, Activate and Revoke of Identities

Note that the retrieval of assets, participants is not tracked, not is any unsuccesful attempt at any operation.

## Querying the Historian

The established APIs for querying and working with resources and relationship are applicable here. The Historian is a registry containing assets (HistorianRecords)
so can be queried quite easily.

For example to get all the Historian records a typicalpromise chain would be as follows. The formating of the output is entirely at the discretion of the user. 

```
    .then(() => {       
        return businessNetworkConnection.getHistorian();
    }).then((historian) => {
  
        return historian.getAll();
    }).then((historianRecords) => {        
       console.log(prettyoutput(historianRecords));
    })
```

As this is a 'getAll' call it will potentially return a vast about of data. Therefore the query capability is vital in being able to select a subset of records.
A typical example would be to select records based on a time. This uses the query ability to select records where the transaction timestamp is past a certain point.
The returned records can be processed in exactly the same way.

```
  let now = new Date();
  now.setMinutes(10);  // set the date to be time you want to query from
  
  let q1 = businessNetworkConnection.buildQuery('SELECT org.hyperledger.composer.system.HistorianRecord' +
                                                'FROM HistorianRegistry WHERE (transactionTimestamp > _$justnow)');   
  
  return businessNetworkConnection.query(q1,{justnow:now});
```

More advanced queries can be used; for example as the Add, Update, and Remove asset are system transactions these can be selected as follows.

```
  // build the special query for historian records
  let q1 = businessNetworkConnection.buildQuery(
      `SELECT org.hyperledger.composer.system.HistorianRecord FROM HistorianRegistry 
          WHERE (transactionType == 'AddAsset' OR transactionType == 'UpdateAsset' OR transactionType == 'RemoveAsset')`
  );      

  return businessNetworkConnection.query(q1);

```



## What next?

- [Applying queries to a business network.](../business-network/query.html)
- [Emitting events from transactions.](../business-network/publishing-events.html)
- [{{site.data.conrefs.composer_full}} API documentation.](../jsdoc/index.html)
