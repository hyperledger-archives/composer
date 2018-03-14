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

'use strict';

class Node {


    constructor(){
        this.children=[];
    }

    setValue(v){
        this.value=v;
    }

    getValue(v){
        return this.value;
    }

    addChild(node){
        this.children.push(node);
    }

    findNode(value){
        if (this.value === value){
            return this;
        } else {
            let node;
            for (let i=0;i<this.children.length;i++){
                node = this.children[i].findNode(value);
                if (node){
                    break;
                }
            }
            return node;
        }
    }

    toString(){
        let childStr= [];
        for (let i=0;i<this.children.length;i++){
            let node = this.children[i];
            childStr.push(node.toString());
        }
        let cs = '\n'+childStr.join(',');
        return ` { "value" : "${this.value}" , "children":[ ${cs} ] }  `;
    }
}

module.exports=Node;