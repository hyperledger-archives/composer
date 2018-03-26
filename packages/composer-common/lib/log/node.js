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

/** @description Internal class for handling a simple directed tree to support filtering
 * @private
 * @class
 * @memberof module:composer-common
 */
class Node {

    /** @description creates a new node
     *
     * @param {String} name name of the node i.e. package & class
     * @param {int} logLevel loglevel for this node
     * @param {boolean} include should this included in the trace
     *
     * @private
     */
    constructor(name,logLevel,include){
        this.name=name;
        this.include =include;
        this.logLevel=logLevel;
        this.children=[];
    }

    /**
     * @description adds a new node as a child of this at the start of the listTitles
     * @param {Node} node Child node to add
     *
     * @private
     */
    addChildNodeAtStart(node){
        this.children.push(node);
    }

    /**
     * @description what is the name of this node?
     * @return {String} name as set on constructor
     *
     * @private
     */
    getName(){
        return this.name;
    }

    /**
     * @description what is the loglevel of this node?
     * @return {int} loglevel as set on constructor
     *
     * @private
     */
    getLogLevel(){
        return this.logLevel;
    }

    /**
     * @description what is the loglevel of this node?
     * @param {int} loglevel as set on constructor
     * @private
     */
    setLogLevel(loglevel){
        this.logLevel = loglevel;
    }

    /**
     * @description is this node included in the set trace settings
     * @return {boolean} included true or false
     *
     * @private
     */
    isIncluded(){
        return this.include;
    }

    /**
     * @description Set the node to be an inclusion
     */
    setIncluded(){
        this.include = true;
    }

   /** Find the node in the children that matches the array
    *
    * @param {String} nameToFind which node to try and locate in the children
    * @return {node} Node that matches -
    *
    * @private
    */
    findChild(nameToFind){
        // do an array search of the children and match the nameToFind
        return this.children.find(function(element){
            return  element.getName()===this;
        },nameToFind);
    }

}

module.exports = Node;
