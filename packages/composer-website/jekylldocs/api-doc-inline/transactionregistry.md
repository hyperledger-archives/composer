---
layout: default
title: TransactionRegistry (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1238
---
# TransactionRegistry

The TransactionRegistry is used to store a set of transactions on the blockchain.
<p><a href="./diagrams/transactionregistry.svg"><img src="./diagrams/transactionregistry.svg" style="height:100%;"/></a></p>

### Details
- **Extends** Registry
- **Module** client

### See also
- See [Registry](registry)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [addTransactionRegistry](#addtransactionregistry-securitycontext-string-string-modelmanager-factory-serializer) | Add a new transaction registry.  |
| `Promise` | [getAllTransactionRegistries](#getalltransactionregistries-securitycontext-modelmanager-factory-serializer-businessnetworkconnection-boolean) | Get a list of all existing transaction registries.  |
| `Promise` | [getTransactionRegistry](#gettransactionregistry-securitycontext-string-modelmanager-factory-serializer) | Get an existing transaction registry.  |
| `Promise` | [transactionRegistryExists](#transactionregistryexists-securitycontext-string-modelmanager-factory-serializer) | Determine whether an registry exists.  |


## Method Details


## getAllTransactionRegistries(securitycontext,modelmanager,factory,serializer,businessnetworkconnection,boolean) 




Get a list of all existing transaction registries.






### Returns
`Promise` - A promise that will be resolved with a list of {@link TransactionRegistry}
instances representing the transaction registries.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this transaction registry.|
|**factory**|`Factory`|true|The factory to use for this transaction registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this transaction registry.|
|**bnc**|`BusinessNetworkConnection`|true|BusinessNetworkConnection to use|
|**systemRegistry**|`Boolean`|true|True if system transaction registries should be included in the list.|




## getTransactionRegistry(securitycontext,string,modelmanager,factory,serializer) 




Get an existing transaction registry.






### Returns
`Promise` - A promise that will be resolved with a {@link TransactionRegistry}
instance representing the transaction registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**id**|`string`|true|The unique identifier of the transaction registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this transaction registry.|
|**factory**|`Factory`|true|The factory to use for this transaction registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this transaction registry.|




## addTransactionRegistry(securitycontext,string,string,modelmanager,factory,serializer) 




Add a new transaction registry.






### Returns
`Promise` - A promise that will be resolved with a {@link TransactionRegistry}
instance representing the new transaction registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**id**|`string`|true|The unique identifier of the transaction registry.|
|**name**|`string`|true|The name of the transaction registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this transaction registry.|
|**factory**|`Factory`|true|The factory to use for this transaction registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this transaction registry.|




## transactionRegistryExists(securitycontext,string,modelmanager,factory,serializer) 




Determine whether an registry exists.






### Returns
`Promise` - A promise that will be resolved with a boolean indicating whether the asset registry exists





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**id**|`string`|true|The unique identifier of the asset registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this asset registry.|
|**factory**|`Factory`|true|The factory to use for this asset registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this asset registry.|


 
