---
layout: default
title: Historian (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1214
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Historian

The Historian records the history of actions taken using Composer.
It is a registry that stores HistorianRecords; each record is created in response
to a transaction being executred.

As well as the transactions that are defined in the Network model other actions such
as adding assets are treated as transactions so are therefore recorded.

Details of these are in the system model.

**Applications should retrieve instances from {@link BusinessNetworkConnection}**

### Details

- **Extends** Registry

- **Module** client



### See also
- See {@link Registry}



## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [add](#add) | `void` | Unsupported operation; you cannot add a historian record to the historian  |
| [addAll](#addall) | `void` | Unsupported operation; you cannot add a historian record to the historian  |
| [getHistorian](#gethistorian) | `Promise` | Get an existing historian  |
| [remove](#remove) | `void` | Unsupported operation; you cannot remove a historian record from the historian  |
| [removeAll](#removeall) | `void` | Unsupported operation; you cannot remove a historian record from the historian  |
| [update](#update) | `void` | Unsupported operation; you cannot update a historian record in the historian  |
| [updateAll](#updateall) | `void` | Unsupported operation; you cannot update a historian record in the historian  |



## Inherited Method Summary
| Supertype | Name | Returns | Description |
| :-------- | :--- | :-------- | :----------- |
| Registry |[getAll](#getall) | `Promise` | Get all of the resources in the registry  |
| Registry |[get](#get) | `Promise` | Get a specific resource in the registry  |
| Registry |[exists](#exists) | `Promise` | Determines whether a specific resource exists in the registry  |
| Registry |[resolveAll](#resolveall) | `Promise` | Get all of the resources in the registry, and resolve all of their relationships to other assets, participants, and transactions  |
| Registry |[resolve](#resolve) | `Promise` | Get a specific resource in the registry, and resolve all of its relationships to other assets, participants, and transactions  |



# Method Details


## getHistorian
_Promise getHistorian( SecurityContext securitycontext, ModelManager modelmanager, Factory factory, Serializer serializer )_


Get an existing historian.





### Returns
**{@link Promise}** - A promise that will be resolved with a {@link IdentityRegistry} instance representing the historian.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**| SecurityContext |*Yes*|The user's security context.|
|**modelManager**| ModelManager |*Yes*|The ModelManager to use for this historian.|
|**factory**| Factory |*Yes*|The factory to use for this historian.|
|**serializer**| Serializer |*Yes*|The Serializer to use for this historian.|










## add
_ add( Resource resource, string data )_


Unsupported operation; you cannot add a historian record to the historian. This method will always throw an exception when called.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**| Resource |*Yes*|The resource to be added to the registry.|
|**data**| string |*Yes*|The data for the resource.|










## addAll
_ addAll(  resources )_


Unsupported operation; you cannot add a historian record to the historian. This method will always throw an exception when called.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resources**|  |*Yes*|The resources to be added to the registry.|










## update
_ update( Resource resource )_


Unsupported operation; you cannot update a historian record in the historian. This method will always throw an exception when called.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**| Resource |*Yes*|The resource to be updated in the registry.|










## updateAll
_ updateAll(  resources )_


Unsupported operation; you cannot update a historian record in the historian. This method will always throw an exception when called.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resources**|  |*Yes*|The resources to be updated in the asset registry.|










## remove
_ remove( Resource; string resource )_


Unsupported operation; you cannot remove a historian record from the historian. This method will always throw an exception when called.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**| Resource; string |*Yes*|The resource, or the unique identifier of the resource.|










## removeAll
_ removeAll( ;  resources )_


Unsupported operation; you cannot remove a historian record from the historian. This method will always throw an exception when called.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resources**| ;  |*Yes*|The resources, or the unique identifiers of the resources.|








 

##Inherited methods




## getAll
_Promise getAll(  )_


**Inherited from:**  Registry

Get all of the resources in the registry.





### Returns
{@link Promise} - A promise that will be resolved with an array of JSON objects representing the resources.




### See also






### Parameters

No parameters










## get
_Promise get( string id )_


**Inherited from:**  Registry

Get a specific resource in the registry.





### Returns
{@link Promise} - A promise that will be resolved with a JSON object representing the resource.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the resource.|











## exists
_Promise exists( string id )_


**Inherited from:**  Registry

Determines whether a specific resource exists in the registry.





### Returns
{@link Promise} - A promise that will be resolved with true/false depending on whether the resource exists.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the resource.|











## resolveAll
_Promise resolveAll(  )_


**Inherited from:**  Registry

Get all of the resources in the registry, and resolve all of their relationships to other assets, participants, and transactions. The result is a JavaScript object, and should only be used for visualization purposes. You cannot use the {@link #add add} or {@link #update update} functions with a resolved resource.





### Returns
{@link Promise} - A promise that will be resolved with an array of JavaScript objects representing the resources and all of their resolved relationships.




### See also






### Parameters

No parameters










## resolve
_Promise resolve( string id )_


**Inherited from:**  Registry

Get a specific resource in the registry, and resolve all of its relationships to other assets, participants, and transactions. The result is a JavaScript object, and should only be used for visualization purposes. You cannot use the  {@link #add add} or {@link #update update} functions with a resolved resource.





### Returns
{@link Promise} - A promise that will be resolved with a JavaScript object representing the resource and all of its resolved relationships.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**| string |*Yes*|The unique identifier of the asset.|








 