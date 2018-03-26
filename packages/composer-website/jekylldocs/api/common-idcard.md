---
layout: default
title: IdCard (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer
index-order: 1233
---
[Overview](api-doc-index)  -  [Common API](allData#common-api)  -  [Client API](allData#client-api)  -  [Admin API](allData#admin-api)  -  [Runtime API](allData#runtime-api)
# IdCard

Business Network Card. Encapsulates credentials and other information required to connect to a specific business network
as a specific user.

Instances of this class can be created using IdCard.fromArchive or IdCard.fromDirectory, as well as the constructor.

### Details

- **Module** common



### See also





## Method Summary
| Name | Returns | Description |
| :---- | :-------- | :----------- |
| [constructor](#constructor) | `void` | Create the IdCard  |
| [fromArchive](#fromarchive) | `Promise` | Create an IdCard from a card archive  |
| [fromDirectory](#fromdirectory) | `Promise` | Create an IdCard from a directory consisting of the content of an ID card  |
| [getBusinessNetworkName](#getbusinessnetworkname) | `String` | Name of the business network to which the ID card applies  |
| [getConnectionProfile](#getconnectionprofile) | `Object` | Connection profile for this card  |
| [getCredentials](#getcredentials) | `Object` | Credentials associated with this card, and which are used to connect to the associated business network  |
| [getDescription](#getdescription) | `String` | Free text description of the card  |
| [getEnrollmentCredentials](#getenrollmentcredentials) | `Object` | Enrollment credentials  |
| [getRoles](#getroles) | `String[]` | Special roles for which this ID can be used, which can include: <ul>   <li>PeerAdmin</li>   <li>ChannelAdmin</li>   <li>Issuer</li> </ul>  |
| [getUserName](#getusername) | `String` | Name of the user identity associated with the card  |
| [setCredentials](#setcredentials) | `void` | Credentials to associate with this card  |
| [toArchive](#toarchive) | `Promise` | Generate a card archive representing this ID card  |
| [toDirectory](#todirectory) | `Promise` | Save the content of an IdCard a directory  |





# Method Details


## new IdCard()


Create the IdCard.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**metadata**| Object |*Yes*|metadata associated with the card.|
|**connectionProfile**| Object |*Yes*|connection profile associated with the card.|










## getUserName
_String getUserName(  )_


Name of the user identity associated with the card. This should be unique within the scope of a given business network and connection profile.
This is a mandatory field.





### Returns
**{@link String}** - Name of the user identity.




### See also






### Parameters

No parameters









## getDescription
_String getDescription(  )_


Free text description of the card.





### Returns
**{@link String}** - card description.




### See also






### Parameters

No parameters









## getBusinessNetworkName
_String getBusinessNetworkName(  )_


Name of the business network to which the ID card applies. Generally this will be present but may be omitted for system cards.





### Returns
**{@link String}** - business network name.




### See also






### Parameters

No parameters









## getConnectionProfile
_Object getConnectionProfile(  )_


Connection profile for this card.
This is a mandatory field.





### Returns
**{@link Object}** - connection profile.




### See also






### Parameters

No parameters









## getCredentials
_Object getCredentials(  )_


Credentials associated with this card, and which are used to connect to the associated business network. <p> For PKI-based authentication, the credentials are expected to be of the form: <em>{ certificate: String, privateKey: String }</em>.





### Returns
**{@link Object}** - credentials.




### See also






### Parameters

No parameters









## setCredentials
_ setCredentials( Object credentials )_


Credentials to associate with this card. <p> For PKI-based authentication, the credentials are expected to be of the form: <em>{ certificate: String, privateKey: String }</em>.







### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**credentials**| Object |*Yes*|credentials.|










## getEnrollmentCredentials
_Object getEnrollmentCredentials(  )_


Enrollment credentials. If there are no credentials associated with this card, these credentials  are used to enroll with a business network and obtain certificates. <p> For an ID/secret enrollment scheme, the credentials are expected to be of the form: <em>{ secret: String }</em>.





### Returns
**{@link Object}** - enrollment credentials, or null if none exist.




### See also






### Parameters

No parameters









## getRoles
_String[] getRoles(  )_


Special roles for which this ID can be used, which can include: <ul>   <li>PeerAdmin</li>   <li>ChannelAdmin</li>   <li>Issuer</li> </ul>





### Returns
**{@link String[]}** - roles.




### See also






### Parameters

No parameters









## fromArchive
_Promise fromArchive( String; ArrayBuffer; Uint8Array; Buffer; Blob; Promise zipdata )_


Create an IdCard from a card archive. <p> Valid types for <em>zipData</em> are any of the types supported by JSZip.





### Returns
**{@link Promise}** - Promise to the instantiated IdCard.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**zipData**| String; ArrayBuffer; Uint8Array; Buffer; Blob; Promise |*Yes*|card archive data.|










## toArchive
_Promise toArchive( [Object options] )_


Generate a card archive representing this ID card. <p> The default value for the <em>options.type</em> parameter is <em>arraybuffer</em>. See JSZip documentation for other valid values.





### Returns
**{@link Promise}** - Promise of the generated ZIP file; by default an ArrayBuffer.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options**| Object |*Yes*|JSZip generation options.|



### Sub-options

| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options.type**| String |*Yes*|type of the resulting ZIP file data.|






## fromDirectory
_Promise fromDirectory( String carddirectory, [ fs] )_


Create an IdCard from a directory consisting of the content of an ID card.





### Returns
**{@link Promise}** - Promise that resolves to an IdCard.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**cardDirectory**| String |*Yes*|directory containing card data.|
|**fs**|  |*Yes*|Node file system API implementation to use for reading card data. Defaults to the Node implementation.|










## toDirectory
_Promise toDirectory( String carddirectory, [ fs] )_


Save the content of an IdCard a directory.





### Returns
**{@link Promise}** - Promise that resolves then the save is complete.




### See also






### Parameters
| Name | Type | Mandatory | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**cardDirectory**| String |*Yes*|directory to save card data.|
|**fs**|  |*Yes*|Node file system API implementation to use for writing card data. Defaults to the Node implementation.|








 

##Inherited methods

 