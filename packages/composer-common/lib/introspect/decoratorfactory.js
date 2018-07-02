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

/**
 * An interface for a class that processes a decorator and returns a specific
 * implementation class for that decorator.
 * @class
 * @memberof module:composer-common
 */
class DecoratorFactory {

    /**
     * Process the decorator, and return a specific implementation class for that
     * decorator, or return null if this decorator is not handled by this processor.
     * @abstract
     * @param {ClassDeclaration | Property} parent - the owner of this property
     * @param {Object} ast - The AST created by the parser
     * @return {Decorator} The decorator.
     */
    newDecorator(parent, ast) {
        throw new Error('abstract function called');
    }

}

module.exports = DecoratorFactory;
