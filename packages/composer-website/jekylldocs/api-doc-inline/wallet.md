---
layout: default
title: Wallet ( API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1244
---
# Wallet

Base class representing a wallet (a container of credentials).

### Details
- **Extends** 
- **Module** 

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [add](#add-string-string) | Add a new credential to the wallet.  |
| `Promise` | [contains](#contains-string) | Check to see if the named credentials are in  |
| `Promise` | [get](#get-string) | Get the named credentials from the wallet.  |
| `Wallet` | [getWallet](#getwallet) | Get the wallet singleton.  |
| `Promise` | [list](#list) | List all of the credentials in the wallet.  |
| `Promise` | [remove](#remove-string) | Remove existing credentials from the wallet.  |
| `void` | [setWallet](#setwallet-wallet) | Set the wallet singleton.  |
| `Promise` | [update](#update-string-string) | Update existing credentials in the wallet.  |


## Method Details


## getWallet() 




Get the wallet singleton.






### Returns
`Wallet` - The wallet singleton, or null if one
has not been specified.





### Parameters


No parameters



## setWallet(wallet) 




Set the wallet singleton.







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**wallet**|`Wallet`|true|The new wallet singleton.|




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


 
