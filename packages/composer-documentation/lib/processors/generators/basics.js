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
/** Gets the basic information and adds to the context
 * @param {Object} context  The internal context
 * @return {Object} the updated context
 */
function basics(context) {
    let bnd = context._bnd;
    let bndMeta = bnd.getMetadata();
    context.core={};
    context.core.description = bnd.getDescription();
    context.core.name = bnd.getName();
    context.core.version = bnd.getVersion();
    context.core.readme = bndMeta.readme;
    context.core.networkImage = bndMeta.packageJson.networkImage;
    return context;
}

module.exports = basics;