---
layout: default
title: ConsoleLogger ( API)
section: api
sidebar: sidebars/accordion-toc0.md
excerpt: The Client, Admin, and Runtime components of Hyperledger Composer .
index-order: 1219
---
# ConsoleLogger

A functional logger implementation that simply writes to the console.

### Details
- **Extends** 
- **Module** 

### See also


## Method Summary
| Returns | Name | Description |
| :--------  | :---- | :----------- |
| `string` | [format](#format-string-string-) | Called to format.  |
| `void` | [log](#log-string-string-string-) | Called to log.  |


## Method Details


## format(string,string,) 




Called to format.






### Returns
`string` - The formatted message.





### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**method**|`string`|true|The method.|
|**msg**|`string`|true|The message.|
|**args**|``|true|The arguments.|




## log(string,string,string,) 




Called to log.







### Parameters
| Name | Type | Optional | Description |
| :-----------  | :----------- | :----------- | :----------- |
|**level**|`string`|true|The logging level.|
|**method**|`string`|true|The method.|
|**msg**|`string`|true|The message.|
|**args**|``|true|The arguments.|


 
