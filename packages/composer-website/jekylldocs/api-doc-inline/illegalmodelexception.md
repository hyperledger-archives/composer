---
layout: default
title: IllegalModelException (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1226
---
# IllegalModelException

Exception throws when a composer file is semantically invalid

### Details
- **Extends** BaseFileException
- **Module** common

### See also
- See [BaseFileException](basefileexception)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-string-modelfile-object-string-string-string-string) | Create an IllegalModelException.  |
| `string` | [getModelFile](#getmodelfile) | Returns the modelfile associated with the exception or null  |


## Method Details


## new IllegalModelException() 




Create an IllegalModelException.







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**message**|`String`|true|the message for the exception|
|**modelFile**|`ModelFile`|true|the optional modelfile associated with the exception|
|**fileLocation**|`Object`|true|location details of the error within the model file.|
|**fileLocation.start.line**|`String`|true|start line of the error location.|
|**fileLocation.start.column**|`String`|true|start column of the error location.|
|**fileLocation.end.line**|`String`|true|end line of the error location.|
|**fileLocation.end.column**|`String`|true|end column of the error location.|




## getModelFile() 




Returns the modelfile associated with the exception or null






### Returns
`string` - the optional filename associated with the model





### Parameters


No parameters

 
