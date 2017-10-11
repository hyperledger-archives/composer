---
layout: default
title: IdentityRegistry (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1225
---
# IdentityRegistry

The IdentityRegistry is used to store a set of identities on the blockchain.
<p><a href="./diagrams/identityregistry.svg"><img src="./diagrams/identityregistry.svg" style="height:100%;"/></a></p>

### Details
- **Extends** Registry
- **Module** client

### See also
- See [Registry](registry)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [getIdentityRegistry](#getidentityregistry-securitycontext-modelmanager-factory-serializer) | Get an existing identity registry.  |


## Method Details


## getIdentityRegistry(securitycontext,modelmanager,factory,serializer) 




Get an existing identity registry.






### Returns
`Promise` - A promise that will be resolved with a {@link IdentityRegistry}
instance representing the identity registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this identity registry.|
|**factory**|`Factory`|true|The factory to use for this identity registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this identity registry.|


 
