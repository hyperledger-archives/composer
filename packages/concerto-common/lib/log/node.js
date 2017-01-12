/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */
'use strict';

/** @description Internal class for handling a simple directed tree to support filtering
 * @private
 * @class
 * @memberof module:concerto-common
 */
class Node {

    /** @description creates a new node
     * @TODO replace the include with a filter level
     *
     * @param {String} name name of the node i.e. package & class
     * @param {boolean} include should this included in the trace
     *
     * @private
     */
    constructor(name,include){
        this.name=name;
        this.include =include;
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
     * @description is this node included in the set trace settings
     * @return {boolean} included true or false
     *
     * @private
     */
    isIncluded(){
        return this.include;
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
