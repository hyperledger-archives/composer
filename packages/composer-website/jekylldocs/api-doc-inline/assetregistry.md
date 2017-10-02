---
layout: default
title: AssetRegistry (Client API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1212
---
# AssetRegistry

The AssetRegistry is used to manage a set of assets stored on the Blockchain.
<p><a href="./diagrams/assetregistry.svg"><img src="./diagrams/assetregistry.svg" style="height:100%;"/></a></p>

### Details
- **Extends** Registry
- **Module** client

### See also
- See [Registry](registry)


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [addAssetRegistry](#addassetregistry-securitycontext-string-string-modelmanager-factory-serializer-businessnetworkconnection) | Add a new asset registry.  |
| `Promise` | [assetRegistryExists](#assetregistryexists-securitycontext-string-modelmanager-factory-serializer) | Determine whether an registry exists.  |
| `void` | [constructor](#constructor-string-string-securitycontext-modelmanager-factory-serializer-businessnetworkconnection) | Create an asset registry.  |
| `Promise` | [getAllAssetRegistries](#getallassetregistries-securitycontext-modelmanager-factory-serializer-businessnetworkconnection-boolean) | Get a list of all existing asset registries.  |
| `Promise` | [getAssetRegistry](#getassetregistry-securitycontext-string-modelmanager-factory-serializer-businessnetworkconnection) | Get an existing asset registry.  |


## Method Details


## getAllAssetRegistries(securitycontext,modelmanager,factory,serializer,businessnetworkconnection,boolean) 




Get a list of all existing asset registries.






### Returns
`Promise` - A promise that will be resolved with a list of {@link AssetRegistry}
instances representing the asset registries.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this asset registry.|
|**factory**|`Factory`|true|The factory to use for this asset registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this asset registry.|
|**bnc**|`BusinessNetworkConnection`|true|Instance of the BusinessNetworkConnection|
|**includeSystem**|`Boolean`|true|Should system registries be included? (defaults to false)|




## getAssetRegistry(securitycontext,string,modelmanager,factory,serializer,businessnetworkconnection) 




Get an existing asset registry.






### Returns
`Promise` - A promise that will be resolved with a {@link AssetRegistry}
instance representing the asset registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**id**|`string`|true|The unique identifier of the asset registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this asset registry.|
|**factory**|`Factory`|true|The factory to use for this asset registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this asset registry.|
|**bnc**|`BusinessNetworkConnection`|true|Instance of the BusinessNetworkConnection|




## assetRegistryExists(securitycontext,string,modelmanager,factory,serializer) 




Determine whether an registry exists.






### Returns
`Promise` - A promise that will be resolved with a boolean indicating whether the asset registry exists





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**id**|`string`|true|The unique identifier of the asset registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this asset registry.|
|**factory**|`Factory`|true|The factory to use for this asset registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this asset registry.|




## addAssetRegistry(securitycontext,string,string,modelmanager,factory,serializer,businessnetworkconnection) 




Add a new asset registry.






### Returns
`Promise` - A promise that will be resolved with a {@link AssetRegistry}
instance representing the new asset registry.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**securityContext**|`SecurityContext`|true|The user's security context.|
|**id**|`string`|true|The unique identifier of the asset registry.|
|**name**|`string`|true|The name of the asset registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this asset registry.|
|**factory**|`Factory`|true|The factory to use for this asset registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this asset registry.|
|**bnc**|`BusinessNetworkConnection`|true|Instance of the BusinessNetworkConnection|




## new AssetRegistry() 




Create an asset registry.
<p>
<strong>Note: Only to be called by framework code. Applications should
retrieve instances from {@link BusinessNetworkConnection}</strong>
</p>







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**id**|`string`|true|The unique identifier of the asset registry.|
|**name**|`string`|true|The display name for the asset registry.|
|**securityContext**|`SecurityContext`|true|The security context to use for this asset registry.|
|**modelManager**|`ModelManager`|true|The ModelManager to use for this asset registry.|
|**factory**|`Factory`|true|The factory to use for this asset registry.|
|**serializer**|`Serializer`|true|The Serializer to use for this asset registry.|
|**bnc**|`BusinessNetworkConnection`|true|Instance of the BusinessNetworkConnection|


 
