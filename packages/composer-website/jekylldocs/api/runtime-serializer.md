---
layout: default
title: Serializer (Runtime API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1254
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# Serializer

Do not attempt to create an instance of this class.<br>
You must use the {@link runtime-api#getSerializer getSerializer}
method instead.

### Details

- **Module** runtime



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [fromJSON](#fromjson) | `Resource` | Create a {@link common-Resource} from a JavaScript object representation  |
| [toJSON](#tojson) | `Object` | Convert a {@link common-Resource} to a JavaScript object suitable for long-term peristent storage  |





# Method Details


## toJSON
_Object toJSON( Resource resource, [Object options] )_


Convert a {@link common-Resource} to a JavaScript object suitable for long-term peristent storage.



### Example
```javascript
// Get the serializer.
var serializer = getSerializer();
// Serialize a vehicle.
var json = serializer.toJSON(vehicle);
```



### Returns
**{@link Object}** - The JavaScript object that represents the resource




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**resource**| Resource |*Yes*|The resource instance to convert to JSON.|
|**options**| Object |*Yes*|The optional serialization options.|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.validate**| boolean |*Yes*|Validate the structure of the resource with its model prior to serialization, true by default.|
|**options.convertResourcesToRelationships**| boolean |*Yes*|Convert resources that are specified for relationship fields into relationships, false by default.|
|**options.permitResourcesForRelationships**| boolean |*Yes*|Permit resources in the place of relationships (serializing them as resources), false by default.|




### Example
```javascript
// Get the serializer.
var serializer = getSerializer();
// Serialize a vehicle.
var json = serializer.toJSON(vehicle);
```



## fromJSON
_Resource fromJSON( Object json, [Object options] )_


Create a {@link common-Resource} from a JavaScript object representation. The JavaScript object should have been created by calling the {@link runtime-Serializer#toJSON toJSON} api



### Example
```javascript
// Get the serializer.
var serializer = getSerializer();
// Serialize a vehicle.
var vehicle = serializer.fromJSON(json);
```



### Returns
**{@link common-Resource}** - The resource.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**json**| Object |*Yes*|The JavaScript object for the resource.|
|**options**| Object |*Yes*|The optional serialization options.|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.acceptResourcesForRelationships**| boolean |*Yes*|Handle JSON objects in the place of strings for relationships, false by default.|




### Example
```javascript
// Get the serializer.
var serializer = getSerializer();
// Serialize a vehicle.
var vehicle = serializer.fromJSON(json);
```

 

##Inherited methods

 