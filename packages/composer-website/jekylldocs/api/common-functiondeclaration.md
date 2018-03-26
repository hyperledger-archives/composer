---
layout: default
title: FunctionDeclaration (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1232
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# FunctionDeclaration

FunctionDeclaration defines a function that has been defined
in a model file. If the name of the function starts with 'on'
then the name of the function denotes the name of a transaction
declaration that the function processes.

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [constructor](#constructor) | `void` | Create a FunctionDeclaration  |
| [getDecorators](#getdecorators) | `string[]` | Returns the decorators that the function was tagged with  |
| [getFunctionText](#getfunctiontext) | `string` | Returns the text of this function  |
| [getLanguage](#getlanguage) | `string` | Returns the programming language that the function is written in  |
| [getName](#getname) | `string` | Returns the name of the function  |
| [getParameterNames](#getparameternames) | `string[]` | Returns the names of the parameters processed by the function  |
| [getParameterTypes](#getparametertypes) | `string[]` | Returns the types of the parameters processed by the function  |
| [getReturnType](#getreturntype) | `string` | Returns the return type for this function  |
| [getThrows](#getthrows) | `string` | Returns the type thrown by this function  |
| [getTransactionDeclarationName](#gettransactiondeclarationname) | `string` | Returns the short name of the transaction declaration that is being processed  |
| [getVisibility](#getvisibility) | `string` | Returns the visibility of this function  |





# Method Details


## new FunctionDeclaration()


Create a FunctionDeclaration







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelManager**| ModelManager |*Yes*|the ModelManager used to validate this function|
|**language**| string |*Yes*|the language that the function is written in. E.g. JS.|
|**name**| string |*Yes*|the name of the function|
|**visibility**| string |*Yes*|the visibility of the function|
|**returnType**| string |*Yes*|the return type of the function|
|**throws**| string |*Yes*|the type that is thrown by the function|
|**parameterNames**|  |*Yes*|the names of parameters of the function|
|**parameterTypes**|  |*Yes*|the type names of parameters of the function|
|**decorators**|  |*Yes*|the function decorators|
|**functionText**| string |*Yes*|the function as text|










## getFunctionText
_string getFunctionText(  )_


Returns the text of this function.





### Returns
**{@link string}** - the text that defines the function




### See also






### Parameters

No parameters









## getThrows
_string getThrows(  )_


Returns the type thrown by this function





### Returns
**{@link string}** - the type thrown by the function




### See also






### Parameters

No parameters









## getLanguage
_string getLanguage(  )_


Returns the programming language that the function is written in





### Returns
**{@link string}** - the language of the function




### See also






### Parameters

No parameters









## getDecorators
_string[] getDecorators(  )_


Returns the decorators that the function was tagged with





### Returns
**{@link string[]}** - the @ prefixed decorators for the function




### See also






### Parameters

No parameters









## getVisibility
_string getVisibility(  )_


Returns the visibility of this function





### Returns
**{@link string}** - the visibility of the function (+ is public), (- is private)




### See also






### Parameters

No parameters









## getReturnType
_string getReturnType(  )_


Returns the return type for this function





### Returns
**{@link string}** - the return type for the function




### See also






### Parameters

No parameters









## getName
_string getName(  )_


Returns the name of the function





### Returns
**{@link string}** - the name of the function.




### See also






### Parameters

No parameters









## getTransactionDeclarationName
_string getTransactionDeclarationName(  )_


Returns the short name of the transaction declaration that is being processed. This is calculated by removing the 'on' prefix from the function name. If the function name does not start with 'on' then null





### Returns
**{@link string}** - the name of the transaction declaration.




### See also






### Parameters

No parameters









## getParameterNames
_string[] getParameterNames(  )_


Returns the names of the parameters processed by the function.





### Returns
**{@link string[]}** - the names of the parameters.




### See also






### Parameters

No parameters









## getParameterTypes
_string[] getParameterTypes(  )_


Returns the types of the parameters processed by the function.





### Returns
**{@link string[]}** - the types of the parameters.




### See also






### Parameters

No parameters







 

##Inherited methods

 