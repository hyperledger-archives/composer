---
layout: default
title: ParticipantRegistry (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1230
---
# ParticipantRegistry

The ParticipantRegistry is used to manage a set of participants stored on the blockchain.
<p><a href="./diagrams/participantregistry.svg"><img src="./diagrams/participantregistry.svg" style="height:100%;"/></a></p>

### Details
- **Extends** Registry
- **Module** client

### See also
- See [Registry](registry)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [addParticipantRegistry](#addparticipantregistry-securitycontext-string-string-modelmanager-factory-serializer-businessnetworkconnection) | Add a new participant registry.  |
| `void` | [constructor](#constructor-string-string-securitycontext-modelmanager-factory-serializer-businessnetworkconnection) | Create an participant registry.  |
| `Promise` | [getAllParticipantRegistries](#getallparticipantregistries-securitycontext-modelmanager-factory-serializer-businessnetworkconnection-boolean) | Get a list of all existing participant registries.  |
| `Promise` | [getParticipantRegistry](#getparticipantregistry-securitycontext-string-modelmanager-factory-serializer-businessnetworkconnection) | Get an existing participant registry.  |
| `Promise` | [participantRegistryExists](#participantregistryexists-securitycontext-string-modelmanager-factory-serializer-businessnetworkconnection) | Determine whether a participant registry exists.  |


## Method Details


## getAllParticipantRegistries(securitycontext,modelmanager,factory,serializer,businessnetworkconnection,boolean) 




Get a list of all existing participant registries.






### Returns
`Promise` - A promise that will be resolved with a list of {@link ParticipantRegistry}
instances representing the participant registries.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this participant registry.|
|**factory**|`Factory`|true|The factory to use for this participant registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this participant registry.|
|**bnc**|`BusinessNetworkConnection`|true|BusinessNetworkConnection to use|
|**includeSystem**|`Boolean`|true|Should system registries be included? (optional, default to false)|




## getParticipantRegistry(securitycontext,string,modelmanager,factory,serializer,businessnetworkconnection) 




Get an existing participant registry.






### Returns
`Promise` - A promise that will be resolved with a {@link ParticipantRegistry}
instance representing the participant registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**id**|`string`|true|The unique identifier of the participant registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this participant registry.|
|**factory**|`Factory`|true|The factory to use for this participant registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this participant registry.|
|**bnc**|`BusinessNetworkConnection`|true|BusinessNetworkConnection to use|




## participantRegistryExists(securitycontext,string,modelmanager,factory,serializer,businessnetworkconnection) 




Determine whether a participant registry exists.






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
|**bnc**|`BusinessNetworkConnection`|true|BusinessNetworkConnection to use|




## addParticipantRegistry(securitycontext,string,string,modelmanager,factory,serializer,businessnetworkconnection) 




Add a new participant registry.






### Returns
`Promise` - A promise that will be resolved with a {@link ParticipantRegistry}
instance representing the new participant registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**id**|`string`|true|The unique identifier of the participant registry.|
|**name**|`string`|true|The name of the participant registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this participant registry.|
|**factory**|`Factory`|true|The factory to use for this participant registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this participant registry.|
|**bnc**|`BusinessNetworkConnection`|true|BusinessNetworkConnection to use|




## new ParticipantRegistry() 




Create an participant registry.
<p>
<strong>Note: Only to be called by framework code. Applications should
retrieve instances from {@link BusinessNetworkConnection}</strong>
</p>







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the participant registry.|
|**name**|`string`|true|The display name for the participant registry.|
|**securityContext**|`SecurityContext`|true|The security context to use for this participant registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this participant registry.|
|**factory**|`Factory`|true|The factory to use for this participant registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this participant registry.|
|**bnc**|`BusinessNetworkConnection`|true|BusinessNetworkConnection to use|


 
