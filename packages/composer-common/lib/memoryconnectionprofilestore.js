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

let LOG;
const FSConnectionProfileStore = require('./fsconnectionprofilestore');
const BrowserFS = require('browserfs/dist/node/index');
const bfs_fs = BrowserFS.BFSRequire('fs');

/**
 * Stores connection profiles on an attached in memory BrowserFS filesystem.
 * The connection profiles are loaded from the ''<HOME_DIR>/composer-connection-profiles/'
 * directory.
 *
 * @private
 * @extends FSConnectionProfileStore
 * @see See [FSConnectionProfileStore]{@link module:composer-common.FSConnectionProfileStore}
 * @class
 * @memberof module:composer-common
 */
class MemoryConnectionProfileStore extends FSConnectionProfileStore {

    /**
     * Create a ConnectionProfileStore that uses BrowserFS
     * @private
     */
    constructor() {
        super(bfs_fs);

        this.browserFilesystem = new BrowserFS.FileSystem.InMemory();
        // for local storage...
        // this.browserFilesystem = new BrowserFS.FileSystem.LocalStorage();

        BrowserFS.initialize(this.browserFilesystem);

        if (!LOG) {
            LOG = require('./log/logger').getLog('MemoryConnectionProfileStore');
        }

        LOG.info('constructor', 'Created MemoryConnectionProfileStore');
    }
}

module.exports = MemoryConnectionProfileStore;
