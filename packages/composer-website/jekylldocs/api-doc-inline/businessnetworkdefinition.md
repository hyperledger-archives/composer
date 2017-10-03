---
layout: default
title: BusinessNetworkDefinition (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1216
---
# BusinessNetworkDefinition

<p>
A BusinessNetworkDefinition defines a set of Participants that exchange Assets by
sending Transactions. This class manages the metadata and domain-specific types for
the network as well as a set of executable scripts.
</p>

### Details
- **Extends** 
- **Module** common

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-string-string-object-string) | Create the BusinessNetworkDefinition.  |
| `Promise` | [fromArchive](#fromarchive-buffer) | Create a BusinessNetworkDefinition from an archive.  |
| `Promise` | [fromDirectory](#fromdirectory-string-object-object-boolean-boolean) | Builds a BusinessNetworkDefintion from the contents of a directory.  |
| `String` | [getDescription](#getdescription) | Returns the description for this business network  |
| `Factory` | [getFactory](#getfactory) | Provides access to the Factory for this business network. The Factory  |
| `String` | [getIdentifier](#getidentifier) | Returns the identifier for this business network  |
| `Introspector` | [getIntrospector](#getintrospector) | Provides access to the Introspector for this business network. The Introspector  |
| `BusinessNetworkMetadata` | [getMetadata](#getmetadata) | Returns the metadata for this business network  |
| `String` | [getName](#getname) | Returns the name for this business network  |
| `Serializer` | [getSerializer](#getserializer) | Provides access to the Serializer for this business network. The Serializer  |
| `String` | [getVersion](#getversion) | Returns the version for this business network  |
| `Buffer` | [toArchive](#toarchive-object) | Store a BusinessNetworkDefinition as an archive.  |


## Method Details


## new BusinessNetworkDefinition() 




Create the BusinessNetworkDefinition.
<p>
<strong>Note: Only to be called by framework code. Applications should
retrieve instances from {@link BusinessNetworkDefinition.fromArchive}</strong>
</p>







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**identifier**|`String`|true|the identifier of the business network. The
identifier is formed from a business network name + '@' + version. The
version is a semver valid version string. If package.json is passed this is ignored.|
|**description**|`String`|true|the description of the business network. If package.json is passed then this is ignored.|
|**packageJson**|`object`|true|the JS object for package.json (optional)|
|**readme**|`String`|true|the readme in markdown for the business network (optional)|




## getIdentifier() 




Returns the identifier for this business network






### Returns
`String` - the identifier of this business network





### Parameters


No parameters



## getMetadata() 




Returns the metadata for this business network






### Returns
`BusinessNetworkMetadata` - the metadata for this business network





### Parameters


No parameters



## getName() 




Returns the name for this business network






### Returns
`String` - the name of this business network





### Parameters


No parameters



## getVersion() 




Returns the version for this business network






### Returns
`String` - the version of this business network. Use semver module
to parse.





### Parameters


No parameters



## getDescription() 




Returns the description for this business network






### Returns
`String` - the description of this business network





### Parameters


No parameters



## fromArchive(buffer) 




Create a BusinessNetworkDefinition from an archive.






### Returns
`Promise` - a Promise to the instantiated business network





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**Buffer**|`Buffer`|true|the Buffer to a zip archive|




## toArchive(object) 




Store a BusinessNetworkDefinition as an archive.






### Returns
`Buffer` - buffer  - the zlib buffer





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options**|`Object`|true|JSZip options|




## fromDirectory(string,object,object,boolean,boolean) 




Builds a BusinessNetworkDefintion from the contents of a directory.
The directory must include a package.json in the root (used to specify
the name, version and description of the business network). This method
is designed to work with business networks that refer to external models
using npm dependencies as well as business networks that statically
package their model files.
<p>
If package.json contains a dependencies property then this method will search for
model (CTO) files under the node_modules directory for each dependency that
passes the options.dependencyGlob pattern.
</p>
<p>
If the network depends on an npm module its dependencies (transitive closure)
will also be scanned for model (CTO) files.
</p>
<p>
The directory may optionally contain a README.md file which is accessible from the
BusinessNetworkMetadata.getREADME method.
</p>
<p>
In addition all model files will be added that are not under node_modules
and that pass the options.modelFileGlob pattern. By default you should put
model files under a directory called 'models'.
</p>
<p>
All script (js) files will be added that are not under node_modules and
that pass the options.scriptGlob pattern. By default you should put Javascript
files under the 'lib' directory.
</p>






### Returns
`Promise` - a Promise to the instantiated business network





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**path**|`String`|true|to a local directory|
|**options**|`Object`|true|an optional set of options to configure the instance.|
|**options.dependencyGlob**|`Object`|true|specify the glob pattern used to match
the npm dependencies to process. Defaults to **|
|**options.modelFileGlob**|`boolean`|true|specify the glob pattern used to match
the model files to include. Defaults to **\/models/**\/*.cto|
|**options.scriptGlob**|`boolean`|true|specify the glob pattern used to match
the script files to include. Defaults to **\/lib/**\/*.js|




## getIntrospector() 




Provides access to the Introspector for this business network. The Introspector
is used to reflect on the types defined within this business network.






### Returns
`Introspector` - the Introspector for this business network





### Parameters


No parameters



## getFactory() 




Provides access to the Factory for this business network. The Factory
is used to create the types defined in this business network.






### Returns
`Factory` - the Factory for this business network





### Parameters


No parameters



## getSerializer() 




Provides access to the Serializer for this business network. The Serializer
is used to serialize instances of the types defined within this business network.






### Returns
`Serializer` - the Serializer for this business network





### Parameters


No parameters

 
