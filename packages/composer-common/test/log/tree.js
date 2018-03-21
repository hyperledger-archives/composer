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

const Node = require('../../lib/log/node');
const Tree = require('../../lib/log/tree');

require('chai').should();

describe('Tree', () => {



    describe('#setRootInclusion', () => {

        it('should set the root node to included', () => {
            let tree = new Tree(false,4);
            tree.setRootInclusion();
            tree.root.isIncluded().should.be.true;
        });

    });

    describe('#setRootLevel', () => {

        it('should set the root node to included', () => {
            let tree = new Tree(false,6);
            tree.setRootLevel(4);
            tree.root.getLogLevel().should.equal(4);
        });

    });

    describe('#addNode', () => {

        it('should add a not included node', () => {
            let tree = new Tree(false,4);
            tree.addNode('alpha', 4, false);
            const node = tree.root.findChild('alpha');
            node.should.be.an.instanceOf(Node);
            node.isIncluded().should.be.false;
            node.getLogLevel().should.equal(4);
        });

        it('should add an included node', () => {
            let tree = new Tree(false,4);
            tree.addNode('alpha', 4,true);
            const node = tree.root.findChild('alpha');
            node.should.be.an.instanceOf(Node);
            node.isIncluded().should.be.true;
            node.getLogLevel().should.equal(4);
        });

        it('should add a deep not included node', () => {
            let tree = new Tree(true,1);
            tree.addNode('alpha/beta/gamma/delta', 4, false);
            let node = tree.root.findChild('alpha');
            node.should.be.an.instanceOf(Node);
            node.isIncluded().should.be.true;
            node.getLogLevel().should.equal(1);
            node = node.findChild('beta');
            node.should.be.an.instanceOf(Node);
            node.getLogLevel().should.equal(1);
            node.isIncluded().should.be.true;
            node = node.findChild('gamma');
            node.should.be.an.instanceOf(Node);
            node.getLogLevel().should.equal(1);
            node.isIncluded().should.be.true;
            node = node.findChild('delta');
            node.should.be.an.instanceOf(Node);
            node.getLogLevel().should.equal(4);
            node.isIncluded().should.be.false;
        });

        it('should add a deep included node', () => {
            let tree = new Tree(false,4);
            tree.addNode('alpha/beta/gamma/delta',4, true);
            let node = tree.root.findChild('alpha');
            node.should.be.an.instanceOf(Node);
            node.isIncluded().should.be.false;
            node = node.findChild('beta');
            node.should.be.an.instanceOf(Node);
            node.isIncluded().should.be.false;
            node = node.findChild('gamma');
            node.should.be.an.instanceOf(Node);
            node.isIncluded().should.be.false;
            node = node.findChild('delta');
            node.should.be.an.instanceOf(Node);
            node.isIncluded().should.be.true;
        });

        it('should cope with an existing node', () => {
            let tree = new Tree(false,4);
            tree.addNode('alpha', 4,false);
            const node = tree.root.findChild('alpha');
            node.should.be.an.instanceOf(Node);
            node.isIncluded().should.be.false;
            tree.addNode('alpha', false);
            const node2 = tree.root.findChild('alpha');
            node2.should.be.an.instanceOf(Node);
            node2.isIncluded().should.be.false;
            node.should.equal(node2);
        });

    });

    describe('#getInclusion', () => {

        it('should return false for no nodes and if root not included', () => {
            let tree = new Tree(false,4);
            tree.getInclusion('alpha').should.be.false;
            tree.getInclusion('alpha/beta/gamma/delta').should.be.false;
        });

        it('should return true for no nodes and if root included', () => {
            let tree = new Tree(false,4);
            tree.setRootInclusion();
            tree.getInclusion('alpha').should.be.true;
            tree.getInclusion('alpha/beta/gamma/delta').should.be.true;
        });

        it('should return false for a node that is not included', () => {
            let tree = new Tree(false,4);
            tree.addNode('alpha',4, false);
            tree.getInclusion('alpha').should.be.false;
            tree.getInclusion('omega').should.be.false;
        });

        it('should return true for a node that is included', () => {
            let tree = new Tree(false,4);
            tree.addNode('alpha',4, true);
            tree.getInclusion('alpha').should.be.true;
            tree.getInclusion('omega').should.be.false;
        });

        it('should return false for a deep node that is not included', () => {
            let tree = new Tree(false,4);
            tree.addNode('alpha/beta/gama/delta', 4, false);
            tree.getInclusion('alpha').should.be.false;
            tree.getInclusion('omega').should.be.false;
        });

        it('should return true for a deep node that is included', () => {
            let tree = new Tree(false,4);
            tree.addNode('alpha/beta/gamma/delta', 4, true);
            tree.getInclusion('alpha/beta/gamma/delta').should.be.true;
            tree.getInclusion('omega').should.be.false;
        });

    });

});
