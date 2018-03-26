---
layout: default
title: Factory (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1230
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Factory

Use the Factory to create instances of Resource: transactions, participants
and assets.

**Applications should retrieve instances of the Factory from {@link BusinessNetworkDefinition#getFactory}**

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [newConcept](#newconcept) | `Resource` | Create a new Concept with a given namespace and type name  |
| [newEvent](#newevent) | `Resource` | Create a new event object  |
| [newRelationship](#newrelationship) | `Relationship` | Create a new Relationship with a given namespace, type and identifier  |
| [newResource](#newresource) | `Resource` | Create a new Resource with a given namespace, type name and id  |
| [newTransaction](#newtransaction) | `Resource` | Create a new transaction object  |





# Method Details


## newResource
_Resource newResource( String ns, String type, String id, [Object options] )_


Create a new Resource with a given namespace, type name and id





### Returns
**{@link common-Resource}** - the new instance




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**| String |*Yes*|the namespace of the Resource|
|**type**| String |*Yes*|the type of the Resource|
|**id**| String |*Yes*|the identifier|
|**options**| Object |*Yes*|an optional set of options|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.disableValidation**| boolean |*Yes*|pass true if you want the factory to return a {@link Resource} instead of a {@link ValidatedResource}. Defaults to false.|
|**options.generate**| String |*Yes*|Pass one of: <dl> <dt>sample</dt><dd>return a resource instance with generated sample data.</dd> <dt>empty</dt><dd>return a resource instance with empty property values.</dd></dl>|
|**options.includeOptionalFields**| boolean |*Yes*|if <code>options.generate</code> is specified, whether optional fields should be generated.|
|**options.allowEmptyId**| boolean |*Yes*|if <code>options.allowEmptyId</code> is specified as true, a zero length string for id is allowed (allows it to be filled in later).|






## newConcept
_Resource newConcept( String ns, String type, [Object options] )_


Create a new Concept with a given namespace and type name





### Returns
**{@link common-Resource}** - the new instance




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**| String |*Yes*|the namespace of the Concept|
|**type**| String |*Yes*|the type of the Concept|
|**options**| Object |*Yes*|an optional set of options|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.disableValidation**| boolean |*Yes*|pass true if you want the factory to return a {@link Concept} instead of a {@link ValidatedConcept}. Defaults to false.|
|**options.generate**| String |*Yes*|Pass one of: <dl> <dt>sample</dt><dd>return a resource instance with generated sample data.</dd> <dt>empty</dt><dd>return a resource instance with empty property values.</dd></dl>|
|**options.includeOptionalFields**| boolean |*Yes*|if <code>options.generate</code> is specified, whether optional fields should be generated.|






## newRelationship
_Relationship newRelationship( String ns, String type, String id )_


Create a new Relationship with a given namespace, type and identifier. A relationship is a typed pointer to an instance. I.e the relationship with `namespace = 'org.acme'`, `type = 'Vehicle'` and `id = 'ABC' creates` a pointer that points at an instance of org.acme.Vehicle with the id ABC.





### Returns
**{@link common-Relationship}** - the new relationship instance




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**| String |*Yes*|the namespace of the Resource|
|**type**| String |*Yes*|the type of the Resource|
|**id**| String |*Yes*|the identifier|










## newTransaction
_Resource newTransaction( String ns, String type, [String id], [Object options] )_


Create a new transaction object. The identifier of the transaction is set to a UUID.





### Returns
**{@link common-Resource}** - A resource for the new transaction.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**| String |*Yes*|the namespace of the transaction.|
|**type**| String |*Yes*|the type of the transaction.|
|**id**| String |*Yes*|an optional identifier for the transaction; if you do not specify one then an identifier will be automatically generated.|
|**options**| Object |*Yes*|an optional set of options|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.generate**| String |*Yes*|Pass one of: <dl> <dt>sample</dt><dd>return a resource instance with generated sample data.</dd> <dt>empty</dt><dd>return a resource instance with empty property values.</dd></dl>|
|**options.includeOptionalFields**| boolean |*Yes*|if <code>options.generate</code> is specified, whether optional fields should be generated.|
|**options.allowEmptyId**| boolean |*Yes*|if <code>options.allowEmptyId</code> is specified as true, a zero length string for id is allowed (allows it to be filled in later).|






## newEvent
_Resource newEvent( String ns, String type, [String id], [Object options] )_


Create a new event object. The identifier of the event is set to a UUID.





### Returns
**{@link common-Resource}** - A resource for the new event.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**ns**| String |*Yes*|the namespace of the event.|
|**type**| String |*Yes*|the type of the event.|
|**id**| String |*Yes*|an optional identifier for the event; if you do not specify one then an identifier will be automatically generated.|
|**options**| Object |*Yes*|an optional set of options|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.generate**| String |*Yes*|Pass one of: <dl> <dt>sample</dt><dd>return a resource instance with generated sample data.</dd> <dt>empty</dt><dd>return a resource instance with empty property values.</dd></dl>|
|**options.includeOptionalFields**| boolean |*Yes*|if <code>options.generate</code> is specified, whether optional fields should be generated.|
|**options.allowEmptyId**| boolean |*Yes*|if <code>options.allowEmptyId</code> is specified as true, a zero length string for id is allowed (allows it to be filled in later).|




 

##Inherited methods

 