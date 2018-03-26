---
layout: default
title: MemoryCardStore (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1236
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# MemoryCardStore

Transient in-memory storage of business network cards, useful for testing.
To use this in preference to the default File System Card Store

### Details

- **Extends** BusinessNetworkCardStore

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [constructor](#constructor) | `void` | Constructor  |
| [delete](#delete) | `void` | Delete a specific card from the store.  |
| [get](#get) | `void` | Gets a card from the store.  |
| [getAll](#getall) | `void` | Gets all cards from the store.  |
| [has](#has) | `void` | Has returns a boolean indicating whether a card with the specified name exists or not.  |
| [put](#put) | `void` | Puts a card in the store. If the named card already exists in the store, it will be replaced.  |



## Inherited Method Summary
| Supertype | Name | Returns | Description |
| :-------- | :--- | :-------- | :----------- |
| BusinessNetworkCardStore |[getDefaultCardName](#getdefaultcardname) | `String` | Get a default name for a given business network card  |



# Method Details


## new MemoryCardStore()


Constructor.







### See also






### Parameters

No parameters









## get
_Promise get( String cardname )_


Gets a card from the store.





### Returns
**{@link Promise}** - A promise that is resolved with an IdCard, or rejected if the card does not exist.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**cardName**| String |*Yes*|The name of the card to get|










## put
_Promise put( String cardname, IdCard card )_


Puts a card in the store. If the named card already exists in the store, it will be replaced.





### Returns
**{@link Promise}** - A promise that resolves once the data is written




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**cardName**| String |*Yes*|The name of the card to save|
|**card**| IdCard |*Yes*|The card|










## has
_Promise has( String cardname )_


Has returns a boolean indicating whether a card with the specified name exists or not.





### Returns
**{@link Promise}** - A promise resolved with true or false.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**cardName**| String |*Yes*|The name of the card to check|










## getAll
_Promise getAll(  )_


Gets all cards from the store.





### Returns
**{@link Promise}** - A promise that is resolved with a Map where the keys are identity card names and the values are IdCard objects.




### See also






### Parameters

No parameters









## delete
_Promise delete( String cardname )_


Delete a specific card from the store.





### Returns
**{@link Promise}** - A promise that resolves to true if the card existed; otherwise false.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**cardName**| String |*Yes*|The name of the card to delete.|








 

##Inherited methods




## getDefaultCardName
_String getDefaultCardName( IdCard card )_


**Inherited from:**  BusinessNetworkCardStore

Get a default name for a given business network card.





### Returns
{@link String} - A card name




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**card**| IdCard |*Yes*|A business network card|








 