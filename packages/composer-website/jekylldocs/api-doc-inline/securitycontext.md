---
layout: default
title: SecurityContext (Common API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1235
---
# SecurityContext

SecurityContext is used to authenticate and manage
user credentials to the underlying blockchain fabric.
<p><a href="./diagrams/securitycontext.svg"><img src="./diagrams/securitycontext.svg" style="height:100%;"/></a></p>

### Details
- **Extends** 
- **Module** common

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `void` | [constructor](#constructor-connection-string) | Create the SecurityContext.  |
| `Connection` | [getConnection](#getconnection) | Get the owning connection.  |
| `string` | [getUser](#getuser) | Get the current username.  |


## Method Details


## new SecurityContext() 




Create the SecurityContext.
<strong>Note: Only to be called by framework code. Applications should
retrieve instances by calling {@link Composer#login login}</strong>
</p>







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**connection**|`Connection`|true|The owning connection.|
|**user**|`string`|true|The user identifier.|




## getConnection() 




Get the owning connection.






### Returns
`Connection` - The owning connection.





### Parameters


No parameters



## getUser() 




Get the current username.






### Returns
`string` - The username





### Parameters


No parameters

 
