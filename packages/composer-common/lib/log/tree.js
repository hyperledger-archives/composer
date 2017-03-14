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

const Node = require('./node.js');

/** Specific tree implementation to work with the inclusion/exclusion log statements
 *
* @private
 */
class Tree {

  /** Create the tree and setup the root node
   */
    constructor(){
        this.root = new Node('composer',false);
    }

    /** Mark the root to be included - defaults to false
     */
    setRootInclusion(){
        this.root.setIncluded();
    }

    /**
     * Add a new node to the tree
     *
     * @param {String} name name of the node to add
     * @param {boolean} include should this be included or not
     * @return {Node} the new node created
    */
    addNode(name, include){
        return this._insertChildNode(name,include,this.root);
    }

    /**
     * Find inclusion property for a given node
     * @param {String} name name of the node to search the tree for
     * @return {boolean} inclusion policy - true or false
     */
    getInclusion(name){
        return this._findNode(name,this.root);
    }

    /**
     * @param {String} name name of the node to search the tree for
     * @param {Node} parent parent node to start searching from
     * @return {boolean} inclusion policy - true or false
     *
     * @private
     */
    _findNode(name, parent){
        // split the name up based on the marker /
        let details = name.split(/\//);
        let newNodeName = details.shift();

        let foundNode =  parent.findChild(newNodeName);
        if ( typeof foundNode === 'undefined' ){
            return parent.isIncluded();
        } else {
            return this._findNode(details.join('/'),foundNode);
        }

    }

    /**
     * Insert a new node based on this parent
     * @param {String} name name of the node to add
     * @param {boolean} include should this be included or not
     * @param {Node} parent node to use as the parent for the children
     * @return {Node} newly inserted node
     *
     * @private
     */
    _insertChildNode(name, include, parent){

      // split the name up based on the marker /
        let details = name.split(/\//);
        let newNodeName = details.shift();

        // Look to see if the node is in the parent already
        let child = parent.findChild(newNodeName);
        if (typeof child === 'undefined' ){

            if (details.length === 0) {
                let newNode = new Node(newNodeName,include);
                parent.addChildNodeAtStart(newNode);
                // at the leaf node return the new node created
                return newNode;
            } else {
                let newNode = new Node(newNodeName,parent.isIncluded());
                parent.addChildNodeAtStart(newNode);
                // request another new node to be created.
                return this._insertChildNode(details.join('/'),include,newNode);
            }
        } else {
          // we have found a node already that matches the name.
            return this._insertChildNode(details.join('/'),include,child);
        }

    }



}
module.exports = Tree;
