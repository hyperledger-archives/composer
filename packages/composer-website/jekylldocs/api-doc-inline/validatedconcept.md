---
layout: default
title: ValidatedConcept (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1241
---
# ValidatedConcept

<p>
Resource is an instance that has a type. The type of the resource
specifies a set of properites (which themselves have types).
</p>
<p>
Type information in Composer is used to validate the structure of
Resource instances and for serialization.
</p>
<p>
Resources are used in Composer to represent Assets, Participants, Transactions and
other domain classes that can be serialized for long-term persistent storage.
</p>

### Details
- **Extends** Identifiable
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

 
