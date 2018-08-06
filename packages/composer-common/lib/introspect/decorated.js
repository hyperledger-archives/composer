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

const Decorator = require('./decorator');
const IllegalModelException = require('./illegalmodelexception');

/**
 * Decorated defines a model element that may have decorators attached.
 *
 * @private
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class Decorated {

    /**
     * Create a Decorated from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {ModelFile} modelFile - the model file
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(modelFile, ast) {
        if(!modelFile) {
            throw new Error('modelFile not specified');
        } else if(!ast) {
            throw new Error('ast not specified');
        }
        this.modelFile = modelFile;
        this.ast = ast;
    }

    /**
     * Returns the ModelFile that defines this class.
     *
     * @return {ModelFile} the owning ModelFile
     */
    getModelFile() {
        return this.modelFile;
    }

    /**
     * Visitor design pattern
     * @param {Object} visitor - the visitor
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    accept(visitor,parameters) {
        return visitor.visit(this, parameters);
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        this.decorators = [];

        if(this.ast.decorators) {
            for(let n=0; n < this.ast.decorators.length; n++ ) {
                let thing = this.ast.decorators[n];
                let modelFile = this.getModelFile();
                let modelManager = modelFile.getModelManager();
                let factories = modelManager.getDecoratorFactories();
                let decorator;
                for (let factory of factories) {
                    decorator = factory.newDecorator(this, thing);
                    if (decorator) {
                        break;
                    }
                }
                if (!decorator) {
                    decorator = new Decorator(this, thing);
                }
                this.decorators.push(decorator);
            }
        }
    }

    /**
     * Semantic validation of the structure of this decorated. Subclasses should
     * override this method to impose additional semantic constraints on the
     * contents/relations of fields.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {

        for(let n=0; n < this.decorators.length; n++) {
            let decorator = this.decorators[n];
            decorator.validate();

            // check we don't have this decorator twice
            for(let i=n+1; i < this.decorators.length; i++) {
                let otherDecorator = this.decorators[i];
                if(decorator.getName() === otherDecorator.getName()) {
                    throw new IllegalModelException(`Duplicate decorator ${decorator.getName()}`,this.modelFile, this.ast.location);
                }
            }
        }
    }

    /**
     * Returns the decorators for this class.
     *
     * @return {Decorator[]} the decorators for the class
     */
    getDecorators() {
        return this.decorators;
    }

    /**
     * Returns the decorator for this class with a given name.
     * @param {string} name  - the name of the decorator
     * @return {Decorator} the decorator attached to this class with the given name, or null if it does not exist.
     */
    getDecorator(name) {
        for(let n=0; n < this.decorators.length; n++) {
            let decorator = this.decorators[n];
            if(decorator.getName() === name) {
                return decorator;
            }
        }

        return null;
    }
}

module.exports = Decorated;
