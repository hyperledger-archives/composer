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
 * <p>
 * Manages a stack and answers queries.
 * </p>
 * @private
 * @class
 * @memberof module:composer-common
 */
class StackComponents {

    /**
     * get the callee file name
     * @return {string} the name of the callee function
     */
    static getCallerFileName() {
        try { throw new Error(); }
        catch (e) {
            let callerName;
            let temp1 = e.stack.split('at')[3];
            let temp3 = temp1.split(':');
            let temp2 = temp3[0].split('/');
            callerName = temp2[temp2.length-1];
            return callerName;
        }
    }
    /**
     * getCallerLineNum is used to retrieve
     * line number from the callee file
     * @return {string} the line number in callee file
     */
    static getCallerLineNum() {
        try { throw new Error(); }
        catch (e) {
            let lineNum;
            let temp1 = e.stack.split('at')[3];
            lineNum = temp1.split(':')[1];
            return lineNum;
        }
    }
}
module.exports = StackComponents;
