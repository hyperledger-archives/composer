---
layout: default
title: BusinessNetworkMetadata (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1217
---
# BusinessNetworkMetadata

<p>
Defines the metadata for a BusinessNeworkDefinition. This includes:
<ul>
  <li>package.json</li>
  <li>README.md (optional)</li>
</ul>
</p>

### Details
- **Extends** 
- **Module** common

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-object-string) | Create the BusinessNetworkMetadata.  |
| `string` | [getDescription](#getdescription) | Returns the description for this business network.  |
| `string` | [getIdentifier](#getidentifier) | Returns the identifier for this business network, formed from name@version.  |
| `string` | [getName](#getname) | Returns the name for this business network.  |
| `object` | [getPackageJson](#getpackagejson) | Returns the package.json for this business network.  |
| `String` | [getREADME](#getreadme) | Returns the README.md for this business network. This may be null if the business network does not have a README.md  |
| `string` | [getVersion](#getversion) | Returns the version for this business network.  |


## Method Details


## new BusinessNetworkMetadata() 




Create the BusinessNetworkMetadata.
<p>
<strong>Note: Only to be called by framework code. Applications should
retrieve instances from {@link BusinessNetworkDefinition}</strong>
</p>







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**packageJson**|`object`|true|the JS object for package.json (required)|
|**readme**|`String`|true|the README.md for the business network (may be null)|




## getREADME() 




Returns the README.md for this business network. This may be null if the business network does not have a README.md






### Returns
`String` - the README.md file for the business network or null





### Parameters


No parameters



## getPackageJson() 




Returns the package.json for this business network.






### Returns
`object` - the Javascript object for package.json





### Parameters


No parameters



## getName() 




Returns the name for this business network.






### Returns
`string` - the name of the business network





### Parameters


No parameters



## getDescription() 




Returns the description for this business network.






### Returns
`string` - the description of the business network





### Parameters


No parameters



## getVersion() 




Returns the version for this business network.






### Returns
`string` - the description of the business network





### Parameters


No parameters



## getIdentifier() 




Returns the identifier for this business network, formed from name@version.






### Returns
`string` - the identifier of the business network





### Parameters


No parameters

 
