---
layout: default
title: Historian (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1222
---
# Historian

The Historian records the history of actions taken using Composer.
It is a registry that stores HistorianRecords; each record is created in response
to a transaction being executred.

As well as the transactions that are defined in the Network model other actions such
as adding assets are treated as transactions so are therefore recorded.

Details of these are in the system model.

### Details
- **Extends** Registry
- **Module** client

### See also
- See [Registry](registry)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [getHistorian](#gethistorian-securitycontext-modelmanager-factory-serializer) | Get an existing historian.  |


## Method Details


## getHistorian(securitycontext,modelmanager,factory,serializer) 




Get an existing historian.






### Returns
`Promise` - A promise that will be resolved with a {@link IdentityRegistry}
instance representing the historian.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this historian.|
|**factory**|`Factory`|true|The factory to use for this historian.|
|**serializer**|`Serializer`|true|The Serializer to use for this historian.|


 
