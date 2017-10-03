---
layout: default
title: Registry (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1232
---
# Registry

Class representing an Abstract Registry.
<p><a href="./diagrams/registry.svg"><img src="./diagrams/registry.svg" style="height:100%;"/></a></p>

### Details
- **Extends** 
- **Module** client

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [add](#add-resource) | Adds a new resource to the registry.  |
| `Promise` | [addAll](#addall-resource[]) | Adds a list of new resources to the registry.  |
| `Promise` | [addRegistry](#addregistry-securitycontext-string-string-string) | Add a new asset registry.  |
| `void` | [constructor](#constructor-string-string-string-securitycontext-modelmanager-factory-serializer-businessnetworkconnection) | Create a registry.  |
| `Promise` | [exists](#exists-string) | Determines whether a specific resource exists in the registry.  |
| `Promise` | [existsRegistry](#existsregistry-securitycontext-string-string) | Determines whether a registry exists.  |
| `Promise` | [get](#get-string) | Get a specific resource in the registry.  |
| `Promise` | [getAll](#getall) | Get all of the resources in the registry.  |
| `Promise` | [getAllRegistries](#getallregistries-securitycontext-string-boolean) | Get a list of all existing registries.  |
| `Promise` | [getRegistry](#getregistry-securitycontext-string-string) | Get an existing registry.  |
| `Promise` | [remove](#remove) | Remove an asset with a given type and id from the registry.  |
| `Promise` | [removeAll](#removeall) | Removes a list of resources from the registry.  |
| `Promise` | [resolve](#resolve-string) | Get a specific resource in the registry, and resolve all of its relationships  |
| `Promise` | [resolveAll](#resolveall) | Get all of the resources in the registry, and resolve all of their relationships  |
| `Promise` | [update](#update-resource) | Updates a resource in the registry.  |
| `Promise` | [updateAll](#updateall-resource[]) | Updates a list of resources in the registry.  |


## Method Details


## getAllRegistries(securitycontext,string,boolean) 




Get a list of all existing registries.






### Returns
`Promise` - A promise that will be resolved with an array of JSON
objects representing the registries.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**registryType**|`string`|true|The type of this registry.|
|**includeSystem**|`boolean`|true|True if system registries should be included (optional default is false)|




## getRegistry(securitycontext,string,string) 




Get an existing registry.






### Returns
`Promise` - A promise that will be resolved with a JSON object
representing the registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**registryType**|`string`|true|The type of this registry.|
|**id**|`string`|true|The unique identifier of the registry.|




## existsRegistry(securitycontext,string,string) 




Determines whether a registry exists.






### Returns
`Promise` - A promise that will be resolved with true/false depending on whether the registry exists





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**registryType**|`string`|true|The type of this registry.|
|**id**|`string`|true|The unique identifier of the registry.|




## addRegistry(securitycontext,string,string,string) 




Add a new asset registry.






### Returns
`Promise` - A promise that will be resolved with a JSON object
representing the registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**registryType**|`string`|true|The type of this registry.|
|**id**|`string`|true|The unique identifier of the registry.|
|**name**|`string`|true|The name of the registry.|




## new Registry() 




Create a registry.

<strong>Note: Only to be called by framework code. Applications should
retrieve instances from {@link BusinessNetworkConnection}</strong>
</p>







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**registryType**|`string`|true|The type of this registry.|
|**id**|`string`|true|The unique identifier of the registry.|
|**name**|`string`|true|The display name for the registry.|
|**securityContext**|`SecurityContext`|true|The users security context.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this registry.|
|**factory**|`Factory`|true|The factory to use for this registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this registry.|
|**bnc**|`BusinessNetworkConnection`|true|Instance of the BusinessNetworkConnection
TODO: Rationalize the bnc with the other objects - as the bnc contains these other arguments|




## addAll(resource[]) 




Adds a list of new resources to the registry.






### Returns
`Promise` - A promise that will be resolved when the resource is
added to the registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resources**|``|true|The resources to be added to the registry.|




## add(resource) 




Adds a new resource to the registry.






### Returns
`Promise` - A promise that will be resolved when the resource is
added to the registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**|`Resource`|true|The resource to be added to the registry.|




## updateAll(resource[]) 




Updates a list of resources in the registry.






### Returns
`Promise` - A promise that will be resolved when the resource is
added to the registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resources**|``|true|The resources to be updated in the asset registry.|




## update(resource) 




Updates a resource in the registry.






### Returns
`Promise` - A promise that will be resolved when the resource is
updated in the registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**|`Resource`|true|The resource to be updated in the registry.|




## removeAll() 




Removes a list of resources from the registry.






### Returns
`Promise` - A promise that will be resolved when the resource is
added to the registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resources**|``|true|The resources, or the unique identifiers of the resources.|




## remove() 




Remove an asset with a given type and id from the registry.






### Returns
`Promise` - A promise that will be resolved when the resource is
removed from the registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**|``|true|The resource, or the unique identifier of the resource.|




## getAll() 




Get all of the resources in the registry.






### Returns
`Promise` - A promise that will be resolved with an array of JSON
objects representing the resources.





### Parameters


No parameters



## get(string) 




Get a specific resource in the registry.






### Returns
`Promise` - A promise that will be resolved with a JSON object
representing the resource.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the resource.|




## exists(string) 




Determines whether a specific resource exists in the registry.






### Returns
`Promise` - A promise that will be resolved with true/false depending on whether the resource exists.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the resource.|




## resolveAll() 




Get all of the resources in the registry, and resolve all of their relationships
to other assets, participants, and transactions. The result is a JavaScript
object, and should only be used for visualization purposes. You cannot use
the {@link add} or {@link update} functions with a resolved resource.






### Returns
`Promise` - A promise that will be resolved with an array of JavaScript
objects representing the resources and all of their resolved relationships.





### Parameters


No parameters



## resolve(string) 




Get a specific resource in the registry, and resolve all of its relationships
to other assets, participants, and transactions. The result is a JavaScript
object, and should only be used for visualization purposes. You cannot use
the {@link add} or {@link update} functions with a resolved resource.






### Returns
`Promise` - A promise that will be resolved with a JavaScript object
representing the resource and all of its resolved relationships.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the asset.|


 
