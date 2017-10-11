---
layout: default
title: ValidatedResource (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1242
---
# ValidatedResource

ValidatedResource is a Resource that can validate that property
changes (or the whole instance) do not violate the structure of
the type information associated with the instance.

### Details
- **Extends** Resource
- **Module** common

### See also
- See [Resource](resource)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [addArrayValue](#addarrayvalue-string-string) | Adds an array property value, validating that it does not violate the model  |
| `void` | [setPropertyValue](#setpropertyvalue-string-string) | Sets a property, validating that it does not violate the model  |
| `void` | [validate](#validate) | Validates the instance against its model.  |


## Method Details


## setPropertyValue(string,string) 




Sets a property, validating that it does not violate the model







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**|`string`|true|the name of the field|
|**value**|`string`|true|the value of the property|




## addArrayValue(string,string) 




Adds an array property value, validating that it does not violate the model







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**propName**|`string`|true|the name of the field|
|**value**|`string`|true|the value of the property|




## validate() 




Validates the instance against its model.







### Parameters


No parameters

 
