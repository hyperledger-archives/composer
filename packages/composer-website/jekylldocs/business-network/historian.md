---
layout: default
title: Hyperledger Composer Historian
category: concepts
section: business-network
index-order: 510
sidebar: sidebars/accordion-toc0.md
excerpt: The Hyperledger Composer Historian is a registry that is populated with records of transactions, the participant submitting the transaction, and the identity used.
---

# {{site.data.conrefs.composer_full}} Historian

The {{site.data.conrefs.composer_full}} Historian is a specialised registry which records successful transactions, including the participants and identities that submitted them. The historian stores transactions as `HistorianRecord` assets, which are defined in the {{site.data.conrefs.composer_full}} system namespace.

The historian registry is a {{site.data.conrefs.composer_full}} system-level entity. To refer to the historian registry as a resource for access control the historian must be referenced as: `org.hyperledger.composer.system.HistorianRecord`.

**Please note:** All participants must have the permission to create `HistorianRecord` assets. If a transaction is submitted by a participant who does not have the permission to create `HistorianRecord` assets, the transaction will fail.


## HistorianRecord assets

The historian registry stores successful transactions as `HistorianRecord` assets. Whenever a transaction successfully completes, a `HistorianRecord` asset is created and added to the historian registry. Record assets are defined in the system namespace, and have the following definition:

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

* `transactionId` The transactionId of the transaction that caused the historian record to be created.
* `String transactionType` The class of transaction that caused the historian record to be created.
* `Transaction transactionInvoked` A relationship to the transaction which caused the historian record to be created.
* `Participant participantInvoking` A relationship to the participant who submitted the transaction.
* `Identity identityUsed` A relationship to the identity used to submit the transaction.
* `Event[] eventsEmitted` An optional property containing any events which were emitted by the transaction.
* `DateTime transactionTimestamp` The timestamp of the transaction which caused the historian record to be created.

All historian record assets have relationships to the transaction that created them, the invoking participant of that transaction, and the identity used when the transaction was submitted. Applications that wish to obtain these attributes must resolve this relationship.

## System transactions

Several operations that the {{site.data.conrefs.composer_full}} runtime makes are classed as transactions. These 'system transactions' are defined in the {{site.data.conrefs.composer_full}} system model. The following will add historian records:

- Adding, removing and updating assets
- Adding, removing and updating participants
- Issuing, binding, activating and revoking identities
- Updating the business network definition


## Securing historian data

As a registry, access to the historian data can be controlled with access control rules. However, as a system-level entity the resource name for the historian registry is always `org.hyperledger.composer.system.HistorianRecord`.

The following access control rule allows members to only see historian data if it references transactions they submitted.

```
rule historianAccess{
  description: "Only allow members to read historian records referencing transactions they submitted."
  participant(p): "org.example.member"
  operation: READ
  resource(r): "org.hyperledger.composer.system.HistorianRecord"
  condition: (r.participantInvoking.getIdentifier() == p.getIdentifier())
  action: ALLOW

}
```

## Retrieving historian data

Data from the historian registry can be retrieved using either an API call, or queries.

### Using the client and REST APIs with historian

Historian records can be returned using the `system/historian` and `system/historian/{id}` calls using the REST API.

When using the REST API, a GET call of `system/historian` will return _ALL_ historian data. This call should be used with care, the return is not limited and may result in large volumes of data being returned.

A GET call of `system/historian/{id}` using the REST API will return the `HistorianRecord` asset specified.

### Querying the Historian

Historian can be queried in the same manner as other registries. For example, a typical query to return all `HistorianRecord` assets would be as follows:

```
    .then(() => {       
        return businessNetworkConnection.getHistorian();
    }).then((historian) => {
        return historian.getAll();
    }).then((historianRecords) => {        
        console.log(prettyoutput(historianRecords));
    })
```

As this is a 'getAll' call it will potentially return high volume of data. Therefore the query capability is vital in being able to select a subset of records. A typical example would be to select records based on a time. This uses the query capability to select records where the transaction timestamp is past a certain point. The returned records can be processed in the same way.

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
