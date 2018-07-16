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

const Decorator = require('./introspect/decorator');
const IllegalModelException = require('./introspect/illegalmodelexception');

/**
 * Specialised decorator implementation for the @commit decorator.
 */
class CommitDecorator extends Decorator {

    /**
     * Create a Decorator.
     * @param {ClassDeclaration | Property} parent - the owner of this property
     * @param {Object} ast - The AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(parent, ast) {
        super(parent, ast);
    }

    /**
     * Process the AST and build the model
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        super.process();
        const args = this.getArguments();
        if (args.length !== 1) {
            throw new IllegalModelException(`@commit decorator expects 1 argument, but ${args.length} arguments were specified.`, this.parent.getModelFile(), this.ast.location);
        }
        const arg = args[0];
        if (typeof arg !== 'boolean') {
            throw new IllegalModelException(`@commit decorator expects a boolean argument, but an argument of type ${typeof arg} was specified.`, this.parent.getModelFile(), this.ast.location);
        }
        this.value = arg;
    }

    /**
     * Get the value of this commit decorator.
     * @return {boolean} The value of this commit decorator.
     */
    getValue() {
        return this.value;
    }

}

module.exports = CommitDecorator;
