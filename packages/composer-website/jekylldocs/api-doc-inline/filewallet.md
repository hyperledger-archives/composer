---
layout: default
title: FileWallet ( API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1221
---
# FileWallet

Class implementing a wallet (a container of credentials) that
stores the credentials on the file system.

### Details
- **Extends** 
- **Module** 

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [add](#add-string-string) | Add a new credential to the wallet.  |
| `void` | [constructor](#constructor-object-string-object) | Constructor.  |
| `Promise` | [contains](#contains-string) | Check to see if the named credentials are in  |
| `Promise` | [get](#get-string) | Get the named credentials from the wallet.  |
| `string` | [getHomeDirectory](#gethomedirectory) | Get the current home directory.  |
| `Promise` | [list](#list) | List all of the credentials in the wallet.  |
| `Promise` | [remove](#remove-string) | Remove existing credentials from the wallet.  |
| `Promise` | [update](#update-string-string) | Update existing credentials in the wallet.  |


## Method Details


## getHomeDirectory() 




Get the current home directory.






### Returns
`string` - The current home directory.





### Parameters


No parameters



## new FileWallet() 




Constructor.







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options**|`Object`|true|The options to use.|
|**options.directory**|`string`|true|The directory to store
credentials in.|
|**fs**|`Object`|true|The file system implementation to use.|




## list() 




List all of the credentials in the wallet.






### Returns
`Promise` - A promise that is resolved with
an array of credential names, or rejected with an
error.





### Parameters


No parameters



## contains(string) 




Check to see if the named credentials are in
the wallet.






### Returns
`Promise` - A promise that is resolved with
a boolean; true if the named credentials are in the
wallet, false otherwise.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**|`string`|true|The name of the credentials.|




## get(string) 




Get the named credentials from the wallet.






### Returns
`Promise` - A promise that is resolved with
the named credentials, or rejected with an error.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**|`string`|true|The name of the credentials.|




## add(string,string) 




Add a new credential to the wallet.






### Returns
`Promise` - A promise that is resolved when
complete, or rejected with an error.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**|`string`|true|The name of the credentials.|
|**value**|`string`|true|The credentials.|




## update(string,string) 




Update existing credentials in the wallet.






### Returns
`Promise` - A promise that is resolved when
complete, or rejected with an error.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**|`string`|true|The name of the credentials.|
|**value**|`string`|true|The credentials.|




## remove(string) 




Remove existing credentials from the wallet.






### Returns
`Promise` - A promise that is resolved when
complete, or rejected with an error.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**name**|`string`|true|The name of the credentials.|


 
