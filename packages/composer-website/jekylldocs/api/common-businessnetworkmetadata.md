---
layout: default
title: BusinessNetworkMetadata (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1223
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# BusinessNetworkMetadata

Defines the metadata for a BusinessNeworkDefinition. This includes:

 - package.json
 - README.md (optional)

**Applications should retrieve instances from {@link BusinessNetworkDefinition}**

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [getDescription](#getdescription) | `String` | Returns the description for this business network  |
| [getIdentifier](#getidentifier) | `String` | Returns the identifier for this business network  |
| [getName](#getname) | `String` | Returns the name for this business network  |
| [getPackageJson](#getpackagejson) | `object` | Returns the package  |
| [getREADME](#getreadme) | `String` | Returns the README  |
| [getVersion](#getversion) | `String` | Returns the version for this business network  |





# Method Details


## getREADME
_String getREADME(  )_


Returns the README.md for this business network. This may be null if the business network does not have a README.md





### Returns
**{@link String}** - the README.md file for the business network or null




### See also






### Parameters

No parameters









## getPackageJson
_object getPackageJson(  )_


Returns the package.json for this business network.





### Returns
**{@link object}** - the Javascript object for package.json




### See also






### Parameters

No parameters









## getName
_String getName(  )_


Returns the name for this business network.





### Returns
**{@link String}** - the name of the business network




### See also






### Parameters

No parameters









## getDescription
_String getDescription(  )_


Returns the description for this business network.





### Returns
**{@link String}** - the description of the business network




### See also






### Parameters

No parameters









## getVersion
_String getVersion(  )_


Returns the version for this business network.





### Returns
**{@link String}** - the description of the business network




### See also






### Parameters

No parameters









## getIdentifier
_String getIdentifier(  )_


Returns the identifier for this business network. Formed from name@version.





### Returns
**{@link String}** - the identifier of the business network




### See also






### Parameters

No parameters







 

##Inherited methods

 