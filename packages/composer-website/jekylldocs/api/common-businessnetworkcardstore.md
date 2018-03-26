---
layout: default
title: BusinessNetworkCardStore (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1221
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# BusinessNetworkCardStore

Manages persistence of business network cards.
Applications would not work with this abstract class directly, but with one of the subclass
{@link FileSystemCardStore} or {@link MemoryCardStore}.  The File system card store is the default for
both Admin and Business Network Connections

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [delete](#delete) | `Promise` | Delete a specific card from the store  |
| [get](#get) | `Promise` | Gets a card from the store  |
| [getAll](#getall) | `Promise` | Gets all cards from the store  |
| [getDefaultCardName](#getdefaultcardname) | `String` | Get a default name for a given business network card  |
| [has](#has) | `Promise` | Has returns a boolean indicating whether a card with the specified name exists or not  |
| [put](#put) | `Promise` | Puts a card in the store  |





# Method Details


## getDefaultCardName
_String getDefaultCardName( IdCard card )_


Get a default name for a given business network card.





### Returns
**{@link String}** - A card name




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**card**| IdCard |*Yes*|A business network card|










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

 