---
layout: default
title: IdCard (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1223
---
# IdCard

An ID card. Encapsulates credentials and other information required to connect to a specific business network
as a specific user.
<p>
Instances of this class should be created using {@link IdCard.fromArchive}.

### Details
- **Extends** 
- **Module** common

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `Promise` | [fromArchive](#fromarchive) | Create an IdCard from a card archive.  |
| `String` | [getBusinessNetworkName](#getbusinessnetworkname) | Name of the business network to which the ID card applies. Generally this will be present but may be  |
| `Object` | [getConnectionProfile](#getconnectionprofile) | Connection profile for this card.  |
| `Object` | [getCredentials](#getcredentials) | Credentials associated with this card, and which are used to connect to the associated business network.  |
| `String` | [getDescription](#getdescription) | Free text description of the card.  |
| `Object` | [getEnrollmentCredentials](#getenrollmentcredentials) | Enrollment credentials. If there are no credentials associated with this card, these credentials  are used to  |
| `String[]` | [getRoles](#getroles) | Special roles for which this ID can be used, which can include:  |
| `String` | [getUserName](#getusername) | Name of the user identity associated with the card. This should be unique within the scope of a given  |
| `void` | [setCredentials](#setcredentials-object) | Credentials to associate with this card.  |
| `Promise` | [toArchive](#toarchive-object-string) | Generate a card archive representing this ID card.  |


## Method Details


## getUserName() 




Name of the user identity associated with the card. This should be unique within the scope of a given
business network and connection profile.
<p>
This is a mandatory field.






### Returns
`String` - Name of the user identity.





### Parameters


No parameters



## getDescription() 




Free text description of the card.






### Returns
`String` - card description.





### Parameters


No parameters



## getBusinessNetworkName() 




Name of the business network to which the ID card applies. Generally this will be present but may be
omitted for system cards.






### Returns
`String` - business network name.





### Parameters


No parameters



## getConnectionProfile() 




Connection profile for this card.
<p>
This is a mandatory field.






### Returns
`Object` - connection profile.





### Parameters


No parameters



## getCredentials() 




Credentials associated with this card, and which are used to connect to the associated business network.
<p>
For PKI-based authentication, the credentials are expected to be of the form:
<em>{ certificate: String, privateKey: String }</em>.






### Returns
`Object` - credentials.





### Parameters


No parameters



## setCredentials(object) 




Credentials to associate with this card.
<p>
For PKI-based authentication, the credentials are expected to be of the form:
<em>{ certificate: String, privateKey: String }</em>.







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**credentials**|`Object`|true|credentials.|




## getEnrollmentCredentials() 




Enrollment credentials. If there are no credentials associated with this card, these credentials  are used to
enroll with a business network and obtain certificates.
<p>
For an ID/secret enrollment scheme, the credentials are expected to be of the form:
<em>{ secret: String }</em>.






### Returns
`Object` - enrollment credentials, or {@link null} if none exist.





### Parameters


No parameters



## getRoles() 




Special roles for which this ID can be used, which can include:
<ul>
  <li>PeerAdmin</li>
  <li>ChannelAdmin</li>
  <li>Issuer</li>
</ul>






### Returns
`` - roles.





### Parameters


No parameters



## fromArchive() 




Create an IdCard from a card archive.
<p>
Valid types for <em>zipData</em> are any of the types supported by JSZip.






### Returns
`Promise` - Promise to the instantiated IdCard.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**zipData**|``|true|card archive data.|




## toArchive(object,string) 




Generate a card archive representing this ID card.
<p>
The default value for the <em>options.type</em> parameter is <em>arraybuffer</em>. See JSZip documentation
for other valid values.






### Returns
`Promise` - Promise of the generated ZIP file; by default an {@link ArrayBuffer}.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**options**|`Object`|true|JSZip generation options.|
|**options.type**|`String`|true|type of the resulting ZIP file data.|


 
