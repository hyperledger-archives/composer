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

let LOG;
const FSConnectionProfileStore = require('./fsconnectionprofilestore');
const BrowserFS = require('browserfs/dist/node/index');
const bfs_fs = BrowserFS.BFSRequire('fs');

/**
 * Stores connection profiles on an attached in memory BrowserFS filesystem.
 * The connection profiles are loaded from the ''<HOME_DIR>/concerto-connection-profiles/'
 * directory.
 *
 * @private
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

        LOG.info('Created MemoryConnectionProfileStore');
    }
}

module.exports = MemoryConnectionProfileStore;
