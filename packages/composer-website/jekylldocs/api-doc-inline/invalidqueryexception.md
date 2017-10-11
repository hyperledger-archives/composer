---
layout: default
title: InvalidQueryException (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1228
---
# InvalidQueryException

Exception thrown for invalid queries

### Details
- **Extends** BaseFileException
- **Module** common

### See also
- See [BaseFileException](basefileexception)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-string-queryfile-object-string-string-string-string) | Create an InvalidQueryException.  |
| `QueryFile` | [getQueryFile](#getqueryfile) | Returns the query file associated with the exception or null  |


## Method Details


## new InvalidQueryException() 




Create an InvalidQueryException.







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**message**|`String`|true|the message for the exception|
|**queryFile**|`QueryFile`|true|the optional queryFile associated with the exception|
|**fileLocation**|`Object`|true|location details of the error within the model file.|
|**fileLocation.start.line**|`String`|true|start line of the error location.|
|**fileLocation.start.column**|`String`|true|start column of the error location.|
|**fileLocation.end.line**|`String`|true|end line of the error location.|
|**fileLocation.end.column**|`String`|true|end column of the error location.|




## getQueryFile() 




Returns the query file associated with the exception or null






### Returns
`QueryFile` - the optional query file associated with the exception





### Parameters


No parameters

 
