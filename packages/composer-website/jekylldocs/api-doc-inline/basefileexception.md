---
layout: default
title: BaseFileException (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1214
---
# BaseFileException

Exception throws when a composer file is semantically invalid

### Details
- **Extends** BaseException
- **Module** common

### See also
- See [BaseException](baseexception)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-string-string-string) | Create an IllegalModelException  |
| `string` | [getFileLocation](#getfilelocation) | Returns the file location associated with the exception or null  |
| `string` | [getShortMessage](#getshortmessage) | Returns the error message without the location of the error  |


## Method Details


## new BaseFileException() 




Create an IllegalModelException







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**message**|`string`|true|the message for the exception|
|**fileLocation**|`string`|true|the optional file location associated with the exception|
|**fullMessage**|`string`|true|the optional full message text|




## getFileLocation() 




Returns the file location associated with the exception or null






### Returns
`string` - the optional location associated with the exception





### Parameters


No parameters



## getShortMessage() 




Returns the error message without the location of the error






### Returns
`string` - the error message





### Parameters


No parameters

 
