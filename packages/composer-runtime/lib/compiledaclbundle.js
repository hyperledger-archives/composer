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

const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('CompiledAclBundle');

/**
 * A script compiler compiles all scripts in a script manager into a compiled
 * script bundle that can easily be called by the runtime.
 * @protected
 */
class CompiledAclBundle {

    /**
     * Constructor.
     * @param {AclRule[]} aclRules The ACL rules to use.
     * @param {Function} generatorFunction The generator function to use.
     */
    constructor(aclRules, generatorFunction) {
        this.aclRules = aclRules;
        this.generatorFunction = generatorFunction;
    }

    /**
     * Execute the specified ACL rule.
     * @param {AclRule} aclRule The ACL rule to execute.
     * @param {Resource} resource The resource being accessed.
     * @param {Resource} participant The participant attempting the operation.
     * @param {Resource} transaction The transaction, if any, that is currently executing.
     * @return {Promise} A promise that is resolved when the transaction has been
     * executed, or rejected with an error.
     */
    execute(aclRule, resource, participant, transaction) {
        const method = 'execute';
        LOG.entry(method, aclRule, resource, participant, transaction);

        // Check to see that the ACL rule is present.
        const exists = this.aclRules.find((thisAclRule) => {
            return thisAclRule.getName() === aclRule.getName();
        });
        if (!exists) {
            throw new Error(`The ACL rule ${aclRule.getName()} does not exist`);
        }

        // Generate an instance of the compiled ACL bundle.
        const bundle = this.generatorFunction();

        // Execute the function.
        const functionName = aclRule.getName();
        const func = bundle[functionName];
        let funcResult;
        try {
            LOG.debug(method, 'Executing function', functionName);
            funcResult = func(resource, participant, transaction);
            LOG.debug(method, 'Function returned', funcResult);
        } catch (e) {
            LOG.debug(method, 'Function threw error', e);
        }

        // Force the result to be a boolean.
        const result = !!funcResult;
        LOG.exit(method, result);
        return result;
    }

}

module.exports = CompiledAclBundle;
