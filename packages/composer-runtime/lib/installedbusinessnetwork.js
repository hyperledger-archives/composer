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

const AclCompiler = require('./aclcompiler');
const QueryCompiler = require('./querycompiler');
const ScriptCompiler = require('./scriptcompiler');
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('InstalledBusinessNetwork');

/**
 * Data associated with the currently installed business network, used by Context.
 * Instances should be created using the newInstance static factory function.
 * @protected
 * @memberof module:composer-runtime
 */
class InstalledBusinessNetwork {
    /**
     * Factory function for creating new instances of InstalledBusinessNetwork.
     * @param {BusinessNetworkDefinition} networkDefinition business network definition
     * @return {InstalledBusinessNetwork} new instance
     * @async
     */
    static async newInstance(networkDefinition) {
        const scriptManager = networkDefinition.getScriptManager();
        const queryManager = networkDefinition.getQueryManager();
        const aclManager = networkDefinition.getAclManager();

        const networkInfo = {
            definition: networkDefinition,
            compiledScriptBundle: new ScriptCompiler().compile(scriptManager),
            compiledQueryBundle: new QueryCompiler().compile(queryManager),
            compiledAclBundle: new AclCompiler().compile(aclManager, scriptManager),
            archive: await networkDefinition.toArchive()
        };

        return new InstalledBusinessNetwork(networkInfo);
    }

    /**
     * Constructor.
     * @param {Object} networkInfo Information on the installed business network
     * @private
     */
    constructor(networkInfo) {
        const method = 'constructor';
        this.definition = networkInfo.definition;
        this.compiledScriptBundle = networkInfo.compiledScriptBundle;
        this.compiledQueryBundle = networkInfo.compiledQueryBundle;
        this.compiledAclBundle = networkInfo.compiledAclBundle;
        this.archive = networkInfo.archive;
        this.historianEnabled = true;
        if (this.definition.getMetadata().getPackageJson().disableHistorian === true) {
            LOG.debug(method, 'Historian disabled');
            this.historianEnabled = false;
        }
    }

    /**
     * Get the business network definition.
     * @return {BusinessNetworkDefinition} business network definition.
     */
    getDefinition() {
        return this.definition;
    }

    /**
     * Get the compiled versions of all scripts contained in the business network.
     * @return {Object} compiled script bundle
     */
    getCompiledScriptBundle() {
        return this.compiledScriptBundle;
    }

    /**
     * Get the compiled versions of all queries contained in the business network.
     * @return {Object} compiled query bundle
     */
    getCompiledQueryBundle() {
        return this.compiledQueryBundle;
    }

    /**
     * Get the compiled versions of all ACLs contained in the business network.
     * @return {Object} compiled ACL bundle
     */
    getCompiledAclBundle() {
        return this.compiledAclBundle;
    }

    /**
     * Get the business network archive.
     * @return {BusinessNetworkArchive} business network archive.
     */
    getArchive() {
        return this.archive;
    }

}

module.exports = InstalledBusinessNetwork;
