---
layout: default
title: BusinessNetworkDefinition (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1222
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# BusinessNetworkDefinition

A BusinessNetworkDefinition defines a set of Participants that exchange Assets by
sending Transactions. This class manages the metadata and domain-specific types for
the network as well as a set of executable scripts.

Applications should
retrieve instances from {@link BusinessNetworkDefinition#fromArchive}

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [fromArchive](#fromarchive) | `Promise` | Create a BusinessNetworkDefinition from an archive  |
| [fromDirectory](#fromdirectory) | `Promise` | Builds a BusinessNetworkDefintion from the contents of a directory.  |
| [getDescription](#getdescription) | `String` | Returns the description for this business network  |
| [getFactory](#getfactory) | `Factory` | Provides access to the Factory for this business network  |
| [getIdentifier](#getidentifier) | `String` | Returns the identifier for this business network The identifier is formed from a business network name + '@' + version  |
| [getIntrospector](#getintrospector) | `Introspector` | Provides access to the Introspector for this business network  |
| [getMetadata](#getmetadata) | `BusinessNetworkMetadata` | Returns the metadata for this business network  |
| [getName](#getname) | `String` | Returns the name for this business network  |
| [getSerializer](#getserializer) | `Serializer` | Provides access to the Serializer for this business network  |
| [getVersion](#getversion) | `String` | Returns the version for this business network  |
| [toArchive](#toarchive) | `Buffer` | Store a BusinessNetworkDefinition as an archive  |





# Method Details


## getIdentifier
_String getIdentifier(  )_


Returns the identifier for this business network The identifier is formed from a business network name + '@' + version. The version is a semver valid version string. It is not used by Hyperledger Composer and is not needed in any other API. It is for application developer information purposes onlyu





### Returns
**{@link String}** - the identifier of this business network




### See also






### Parameters

No parameters









## getMetadata
_BusinessNetworkMetadata getMetadata(  )_


Returns the metadata for this business network





### Returns
**{@link common-BusinessNetworkMetadata}** - the metadata for this business network




### See also






### Parameters

No parameters









## getName
_String getName(  )_


Returns the name for this business network





### Returns
**{@link String}** - the name of this business network




### See also






### Parameters

No parameters









## getVersion
_String getVersion(  )_


Returns the version for this business network





### Returns
**{@link String}** - the version of this business network. Use semver module to parse.




### See also






### Parameters

No parameters









## getDescription
_String getDescription(  )_


Returns the description for this business network





### Returns
**{@link String}** - the description of this business network




### See also






### Parameters

No parameters









## fromArchive
_Promise fromArchive( Buffer buffer )_


Create a BusinessNetworkDefinition from an archive.





### Returns
**{@link Promise}** - a Promise to the instantiated business network




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**Buffer**| Buffer |*Yes*|the Buffer to a zip archive|










## toArchive
_Buffer toArchive( [Object options] )_


Store a BusinessNetworkDefinition as an archive.





### Returns
**{@link Buffer}** - buffer  - the zlib buffer




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options**| Object |*Yes*|JSZip options|










## fromDirectory
_Promise fromDirectory( String path, [Object options] )_


Builds a BusinessNetworkDefintion from the contents of a directory. The directory must include a package.json in the root (used to specify the name, version and description of the business network). This method is designed to work with business networks that refer to external models using npm dependencies as well as business networks that statically package their model files. <p> If package.json contains a dependencies property then this method will search for model (CTO) files under the node_modules directory for each dependency that passes the options.dependencyGlob pattern. </p> <p> If the network depends on an npm module its dependencies (transitive closure) will also be scanned for model (CTO) files. </p> <p> The directory may optionally contain a README.md file which is accessible from the BusinessNetworkMetadata.getREADME method. </p> <p> In addition all model files will be added that are not under node_modules and that pass the options.modelFileGlob pattern. By default you should put model files under a directory called 'models'. </p> <p> All script (js) files will be added that are not under node_modules and that pass the options.scriptGlob pattern. By default you should put Javascript files under the 'lib' directory. </p>





### Returns
**{@link Promise}** - a Promise to the instantiated business network




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**path**| String |*Yes*|to a local directory|
|**options**| Object |*Yes*|an optional set of options to configure the instance.|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.dependencyGlob**| Object |*Yes*|specify the glob pattern used to match the npm dependencies to process. Defaults to **|
|**options.modelFileGlob**| boolean |*Yes*|specify the glob pattern used to match the model files to include. Defaults to **\/models/**\/*.cto|
|**options.scriptGlob**| boolean |*Yes*|specify the glob pattern used to match the script files to include. Defaults to **\/lib/**\/*.js|






## getIntrospector
_Introspector getIntrospector(  )_


Provides access to the Introspector for this business network. The Introspector is used to reflect on the types defined within this business network.





### Returns
**{@link common-Introspector}** - the Introspector for this business network




### See also






### Parameters

No parameters









## getFactory
_Factory getFactory(  )_


Provides access to the Factory for this business network. The Factory is used to create the types defined in this business network.





### Returns
**{@link runtime-Factory}** - the Factory for this business network




### See also






### Parameters

No parameters









## getSerializer
_Serializer getSerializer(  )_


Provides access to the Serializer for this business network. The Serializer is used to serialize instances of the types defined within this business network.





### Returns
**{@link runtime-Serializer}** - the Serializer for this business network




### See also






### Parameters

No parameters







 

##Inherited methods

 