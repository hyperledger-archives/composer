---
layout: default
title: Factory (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1220
---
# Factory

Use the Factory to create instances of Resource: transactions, participants
and assets.
<p><a href="./diagrams/factory.svg"><img src="./diagrams/factory.svg" style="height:100%;"/></a></p>

### Details
- **Extends** 
- **Module** common

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-modelmanager) | Create the factory.  |
| `Resource` | [newConcept](#newconcept-string-string-object-boolean-string-boolean) | Create a new Concept with a given namespace and type name  |
| `Resource` | [newEvent](#newevent-string-string-string-object-string-boolean) | Create a new event object. The identifier of the event is  |
| `Relationship` | [newRelationship](#newrelationship-string-string-string) | Create a new Relationship with a given namespace, type and identifier.  |
| `Resource` | [newResource](#newresource-string-string-string-object-boolean-string-boolean) | Create a new Resource with a given namespace, type name and id  |
| `Resource` | [newTransaction](#newtransaction-string-string-string-object-string-boolean) | Create a new transaction object. The identifier of the transaction is  |


## Method Details


## new Factory() 




Create the factory.
<p>
<strong>Note: Only to be called by framework code. Applications should
retrieve instances from {@link Hyperledger-Composer}</strong>
</p>







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**modelManager**|`ModelManager`|true|The ModelManager to use for this registry|




## newResource(string,string,string,object,boolean,string,boolean) 




Create a new Resource with a given namespace, type name and id






### Returns
`Resource` - the new instance





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**|`string`|true|the namespace of the Resource|
|**type**|`string`|true|the type of the Resource|
|**id**|`string`|true|the identifier|
|**options**|`Object`|true|an optional set of options|
|**options.disableValidation**|`boolean`|true|pass true if you want the factory to
return a {@link Resource} instead of a {@link ValidatedResource}. Defaults to false.|
|**options.generate**|`string`|true|Pass one of: <dl>
<dt>sample</dt><dd>return a resource instance with generated sample data.</dd>
<dt>empty</dt><dd>return a resource instance with empty property values.</dd></dl>|
|**options.includeOptionalFields**|`boolean`|true|if <code>options.generate</code>
is specified, whether optional fields should be generated.|




## newConcept(string,string,object,boolean,string,boolean) 




Create a new Concept with a given namespace and type name






### Returns
`Resource` - the new instance





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**|`string`|true|the namespace of the Concept|
|**type**|`string`|true|the type of the Concept|
|**options**|`Object`|true|an optional set of options|
|**options.disableValidation**|`boolean`|true|pass true if you want the factory to
return a {@link Concept} instead of a {@link ValidatedConcept}. Defaults to false.|
|**options.generate**|`string`|true|Pass one of: <dl>
<dt>sample</dt><dd>return a resource instance with generated sample data.</dd>
<dt>empty</dt><dd>return a resource instance with empty property values.</dd></dl>|
|**options.includeOptionalFields**|`boolean`|true|if <code>options.generate</code>
is specified, whether optional fields should be generated.|




## newRelationship(string,string,string) 




Create a new Relationship with a given namespace, type and identifier.
A relationship is a typed pointer to an instance. I.e the relationship
with namespace = 'org.acme', type = 'Vehicle' and id = 'ABC' creates`
a pointer that points at an instance of org.acme.Vehicle with the id
ABC.






### Returns
`Relationship` - the new relationship instance





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**|`string`|true|the namespace of the Resource|
|**type**|`string`|true|the type of the Resource|
|**id**|`string`|true|the identifier|




## newTransaction(string,string,string,object,string,boolean) 




Create a new transaction object. The identifier of the transaction is
set to a UUID.






### Returns
`Resource` - A resource for the new transaction.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**|`string`|true|the namespace of the transaction.|
|**type**|`string`|true|the type of the transaction.|
|**id**|`string`|true|an optional identifier for the transaction; if you do not specify
one then an identifier will be automatically generated.|
|**options**|`Object`|true|an optional set of options|
|**options.generate**|`string`|true|Pass one of: <dl>
<dt>sample</dt><dd>return a resource instance with generated sample data.</dd>
<dt>empty</dt><dd>return a resource instance with empty property values.</dd></dl>|
|**options.includeOptionalFields**|`boolean`|true|if <code>options.generate</code>
is specified, whether optional fields should be generated.|




## newEvent(string,string,string,object,string,boolean) 




Create a new event object. The identifier of the event is
set to a UUID.






### Returns
`Resource` - A resource for the new event.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**|`string`|true|the namespace of the event.|
|**type**|`string`|true|the type of the event.|
|**id**|`string`|true|an optional identifier for the event; if you do not specify
one then an identifier will be automatically generated.|
|**options**|`Object`|true|an optional set of options|
|**options.generate**|`string`|true|Pass one of: <dl>
<dt>sample</dt><dd>return a resource instance with generated sample data.</dd>
<dt>empty</dt><dd>return a resource instance with empty property values.</dd></dl>|
|**options.includeOptionalFields**|`boolean`|true|if <code>options.generate</code>
is specified, whether optional fields should be generated.|


 
