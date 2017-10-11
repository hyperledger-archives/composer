---
layout: default
title: Serializer (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1237
---
# Serializer

Serialize Resources instances to/from various formats for long-term storage
(e.g. on the blockchain).
<p><a href="./diagrams/serializer.svg"><img src="./diagrams/serializer.svg" style="height:100%;"/></a></p>

### Details
- **Extends** 
- **Module** common

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-factory-modelmanager) | Create a Serializer.  |
| `Resource` | [fromJSON](#fromjson-object-object-boolean-boolean) | Create a {@link Resource} from a JavaScript Object representation.  |
| `Object` | [toJSON](#tojson-resource-object-boolean-boolean-boolean-boolean) | <p>  |


## Method Details


## new Serializer() 




Create a Serializer.
<strong>Note: Only to be called by framework code. Applications should
retrieve instances from {@link Composer}</strong>
</p>







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**factory**|`Factory`|true|The Factory to use to create instances|
|**modelManager**|`ModelManager`|true|The ModelManager to use for validation etc.|




## toJSON(resource,object,boolean,boolean,boolean,boolean) 




<p>
Convert a {@link Resource} to a JavaScript object suitable for long-term
peristent storage.
</p>






### Returns
`Object` - The Javascript Object that represents the resource





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**|`Resource`|true|The instance to convert to JSON|
|**options**|`Object`|true|the optional serialization options.|
|**options.validate**|`boolean`|true|validate the structure of the Resource
with its model prior to serialization (default to true)|
|**options.convertResourcesToRelationships**|`boolean`|true|Convert resources that
are specified for relationship fields into relationships, false by default.|
|**options.permitResourcesForRelationships**|`boolean`|true|Permit resources in the
place of relationships (serializing them as resources), false by default.|
|**options.deduplicateResources**|`boolean`|true|Generate $id for resources and
if a resources appears multiple times in the object graph only the first instance is
serialized in full, subsequent instances are replaced with a reference to the $id|




## fromJSON(object,object,boolean,boolean) 




Create a {@link Resource} from a JavaScript Object representation.
The JavaScript Object should have been created by calling the
{@link Serializer#toJSON toJSON} API.

The Resource is populated based on the JavaScript object.






### Returns
`Resource` - The new populated resource





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**jsonObject**|`Object`|true|The JavaScript Object for a Resource|
|**options**|`Object`|true|the optional serialization options|
|**options.acceptResourcesForRelationships**|`boolean`|true|handle JSON objects
in the place of strings for relationships, defaults to false.|
|**options.validate**|`boolean`|true|validate the structure of the Resource
with its model prior to serialization (default to true)|


 
