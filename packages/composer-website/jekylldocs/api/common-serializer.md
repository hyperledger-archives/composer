---
layout: default
title: Serializer (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1244
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Serializer

Serialize Resources instances to/from various formats for long-term storage
(e.g. on the blockchain).

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [constructor](#constructor) | `void` | Create a Serializer  |
| [fromJSON](#fromjson) | `Resource` | Create a {@link Resource} from a JavaScript Object representation  |
| [toJSON](#tojson) | `Object` | <p> Convert a {@link Resource} to a JavaScript object suitable for long-term peristent storage  |





# Method Details


## new Serializer()


Create a Serializer. <strong>Note: Only to be called by framework code. Applications should retrieve instances from {@link BusinessNetworkDefinition}</strong> </p>







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**factory**| Factory |*Yes*|The Factory to use to create instances|
|**modelManager**| ModelManager |*Yes*|The ModelManager to use for validation etc.|










## toJSON
_Object toJSON( Resource resource, Object options )_


<p> Convert a {@link Resource} to a JavaScript object suitable for long-term peristent storage. </p>





### Returns
**{@link Object}** - The Javascript Object that represents the resource




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**| Resource |*Yes*|The instance to convert to JSON|
|**options**| Object |*Yes*|the optional serialization options.|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.validate**| boolean |*Yes*|validate the structure of the Resource with its model prior to serialization (default to true)|
|**options.convertResourcesToRelationships**| boolean |*Yes*|Convert resources that are specified for relationship fields into relationships, false by default.|
|**options.permitResourcesForRelationships**| boolean |*Yes*|Permit resources in the place of relationships (serializing them as resources), false by default.|
|**options.deduplicateResources**| boolean |*Yes*|Generate $id for resources and if a resources appears multiple times in the object graph only the first instance is serialized in full, subsequent instances are replaced with a reference to the $id|






## fromJSON
_Resource fromJSON( Object jsonobject, Object options )_


Create a {@link Resource} from a JavaScript Object representation. The JavaScript Object should have been created by calling the {@link Serializer#toJSON toJSON} API.
The Resource is populated based on the JavaScript object.





### Returns
**{@link common-Resource}** - The new populated resource




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**jsonObject**| Object |*Yes*|The JavaScript Object for a Resource|
|**options**| Object |*Yes*|the optional serialization options|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.acceptResourcesForRelationships**| boolean |*Yes*|handle JSON objects in the place of strings for relationships, defaults to false.|
|**options.validate**| boolean |*Yes*|validate the structure of the Resource with its model prior to serialization (default to true)|




 

##Inherited methods

 