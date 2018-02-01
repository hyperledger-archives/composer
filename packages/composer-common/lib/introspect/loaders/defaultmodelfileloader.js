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

const CompositeModelFileLoader = require('./compositemodelfileloader');
const HTTPModelFileLoader = require('./httpmodelfileloader');
const GitHubModelFileLoader = require('./githubmodelfileloader');

/**
 * <p>
 * A default CompositeModelFileLoader implementation which supports
 * github://, http:// and https:// URLs.
 * </p>
 * @private
 * @class
 * @see See {@link CompositeModelFileLoader}
 * @memberof module:composer-common
 */
class DefaultModelFileLoader extends CompositeModelFileLoader {

    /**
     * Create the DefaultModelFileLoader.
     * @param {ModelManager} modelManager - the model manager to use
     */
    constructor(modelManager) {
        super();
        const http = new HTTPModelFileLoader(modelManager);
        const github = new GitHubModelFileLoader(modelManager);
        this.addModelFileLoader(github);
        this.addModelFileLoader(http);
    }
}

module.exports = DefaultModelFileLoader;
