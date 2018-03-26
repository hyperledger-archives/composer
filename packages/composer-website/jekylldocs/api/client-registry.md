---
layout: default
title: Registry (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1218
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Registry

Class representing an Abstract Registry.

** Applications should retrieve instances from {@link BusinessNetworkConnection}**

### Details

- **Module** client



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [add](#add) | `Promise` | Adds a new resource to the registry  |
| [addAll](#addall) | `Promise` | Adds a list of new resources to the registry  |
| [exists](#exists) | `Promise` | Determines whether a specific resource exists in the registry  |
| [get](#get) | `Promise` | Get a specific resource in the registry  |
| [getAll](#getall) | `Promise` | Get all of the resources in the registry  |
| [remove](#remove) | `Promise` | Remove an asset with a given type and id from the registry  |
| [removeAll](#removeall) | `Promise` | Removes a list of resources from the registry  |
| [resolve](#resolve) | `Promise` | Get a specific resource in the registry, and resolve all of its relationships to other assets, participants, and transactions  |
| [resolveAll](#resolveall) | `Promise` | Get all of the resources in the registry, and resolve all of their relationships to other assets, participants, and transactions  |
| [update](#update) | `Promise` | Updates a resource in the registry  |
| [updateAll](#updateall) | `Promise` | Updates a list of resources in the registry  |





# Method Details


## addAll
_Promise addAll(  resources )_


Adds a list of new resources to the registry.





### Returns
**{@link Promise}** - A promise that will be resolved when the resource is added to the registry.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resources**|  |*Yes*|The resources to be added to the registry.|










## add
_Promise add( Resource resource )_


Adds a new resource to the registry.





### Returns
**{@link Promise}** - A promise that will be resolved when the resource is added to the registry.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**| Resource |*Yes*|The resource to be added to the registry.|










## updateAll
_Promise updateAll(  resources )_


Updates a list of resources in the registry.





### Returns
**{@link Promise}** - A promise that will be resolved when the resource is added to the registry.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resources**|  |*Yes*|The resources to be updated in the asset registry.|










## update
_Promise update( Resource resource )_


Updates a resource in the registry.





### Returns
**{@link Promise}** - A promise that will be resolved when the resource is updated in the registry.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**| Resource |*Yes*|The resource to be updated in the registry.|










## removeAll
_Promise removeAll( ;  resources )_


Removes a list of resources from the registry.





### Returns
**{@link Promise}** - A promise that will be resolved when the resource is added to the registry.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resources**| ;  |*Yes*|The resources, or the unique identifiers of the resources.|










## remove
_Promise remove( Resource; string resource )_


Remove an asset with a given type and id from the registry.





### Returns
**{@link Promise}** - A promise that will be resolved when the resource is removed from the registry.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**| Resource; string |*Yes*|The resource, or the unique identifier of the resource.|










## getAll
_Promise getAll(  )_


Get all of the resources in the registry.





### Returns
**{@link Promise}** - A promise that will be resolved with an array of JSON objects representing the resources.




### See also






### Parameters

No parameters









## get
_Promise get( string id )_


Get a specific resource in the registry.





### Returns
**{@link Promise}** - A promise that will be resolved with a JSON object representing the resource.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the resource.|










## exists
_Promise exists( string id )_


Determines whether a specific resource exists in the registry.





### Returns
**{@link Promise}** - A promise that will be resolved with true/false depending on whether the resource exists.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the resource.|










## resolveAll
_Promise resolveAll(  )_


Get all of the resources in the registry, and resolve all of their relationships to other assets, participants, and transactions. The result is a JavaScript object, and should only be used for visualization purposes. You cannot use the {@link #add add} or {@link #update update} functions with a resolved resource.





### Returns
**{@link Promise}** - A promise that will be resolved with an array of JavaScript objects representing the resources and all of their resolved relationships.




### See also






### Parameters

No parameters









## resolve
_Promise resolve( string id )_


Get a specific resource in the registry, and resolve all of its relationships to other assets, participants, and transactions. The result is a JavaScript object, and should only be used for visualization purposes. You cannot use the  {@link #add add} or {@link #update update} functions with a resolved resource.





### Returns
**{@link Promise}** - A promise that will be resolved with a JavaScript object representing the resource and all of its resolved relationships.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the asset.|








 

##Inherited methods

 