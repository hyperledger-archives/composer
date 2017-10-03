---
layout: default
title: TypeNotFoundException (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1240
---
# TypeNotFoundException

Error thrown when a Composer type does not exist.

### Details
- **Extends** BaseException
- **Module** common

### See also
- See [BaseException](baseexception)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-string-string) | Constructor. If the optional 'message' argument is not supplied, it will be set to a default value that  |
| `string` | [getTypeName](#gettypename) | Get the name of the type that was not found.  |


## Method Details


## new TypeNotFoundException() 




Constructor. If the optional 'message' argument is not supplied, it will be set to a default value that
includes the type name.







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**typeName**|`String`|true|fully qualified type name.|
|**message**|`String`|true|error message.|




## getTypeName() 




Get the name of the type that was not found.






### Returns
`string` - fully qualified type name.





### Parameters


No parameters

 
