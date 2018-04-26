/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

{
var functions = {};
var buffer = '';
var f='';
}

start
  =  unit* {return functions;}

unit
  =  func
  /  string
  /  multi_line_comment
  /  single_line_comment
  /  any_char

NamespaceToken    = "namespace"   
AbstractToken     = "abstract"    
ConceptToken      = "concept"     
AssetToken        = "asset"       
TransactionToken  = "transaction" 
EventToken        = "event"       
ParticipantToken  = "participant" 
FromToken         = "from"        

type
 = "transaction"
 / "asset"
 / "event"
 / "concept"
 / "participant"
 

func
  =  m:multi_line_comment spaces? Decorators spaces? AbstractToken? spaces? type spaces id:identifier {functions[id] = m;}
  /  "function" spaces id:identifier                              {functions[id] = null;}

multi_line_comment
  =  "/*" 
     ( !{return buffer.match(/\*\//)} c:. {buffer += c;  }  )*               
     {
       var temp = buffer; 
       buffer = ''; 
       var temp2=f;
       f='';
       //return "/*" + temp.replace(/\s+/g, ' ');
       return temp; // this is the useful one
     }

single_line_comment
  =  "//" [^\r\n]*

identifier
  =  a:([a-z] / [A-Z] / "_") b:([a-z] / [A-Z] / [0-9] /"_")* {return a + b.join("");}

spaces
  =  [ \t\r\n]+ {return "";}

string
  =  "\"" ("\\" . / [^"])* "\""
  /  "'" ("\\" . / [^'])* "'"

any_char
  =  .

DecoratorArgs 
 = (string ",")* string

Decorator
  = "@docs" "(" DecoratorArgs ")"
  / "@docsuri" "(" DecoratorArgs ")"

Decorators
  = (Decorator spaces )*  