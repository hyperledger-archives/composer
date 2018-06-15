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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const fs = require('fs');
let DepGraph = require('dependency-graph').DepGraph;
const _ = require('lodash');
const cmdUtil = require('../../utils/cmdutils');
const path = require('path');
const EventEmitter = require('events');
const chalk = require('chalk');

/**
 * composer archive validate command
 * https://hyperledger.github.io/composer/latest/reference/model-compatibility
 * @private
 */
class MigrationChecker extends EventEmitter {

    /**
     * @param {Object} args command line arguments
     */
    constructor(args) {
        super();
        this.facts = {
            comingFromClassList: [],
            goingToClassList: []
        };
        this.facts.graph_comingFrom = new DepGraph();
        this.facts.graph_goingTo = new DepGraph();
        this.events = { 'success': [], 'failure': [], 'warning': [] };
        this.fromFileName = path.resolve(args.f);
        this.toFileName = path.resolve(args.t);
    }

    /**
     * Creates a DAG (directed acyclic graph) to represent declaration hierarchy of a model file
     */
    async loadNetworks() {

        // Load business network definitions for each bna file
        let bnd_comingFrom = await BusinessNetworkDefinition.fromArchive(fs.readFileSync(this.fromFileName));
        let bnd_goingTo = await BusinessNetworkDefinition.fromArchive(fs.readFileSync(this.toFileName));

        // Create list of namespace declarations for each bna (transactions, participants, assets, events, enums, concepts)
        let classDeclarations_from = bnd_comingFrom.getIntrospector().getClassDeclarations().filter((e) => { return !e.isSystemType(); });
        let classDeclarations_to = bnd_goingTo.getIntrospector().getClassDeclarations().filter((e) => { return !e.isSystemType(); });

        // Create a DAG (directed acyclic graph) of declarations where namespace is the key and Type object is the value
        for (const iterator of classDeclarations_from) {
            this.facts.graph_comingFrom.addNode(iterator.getFullyQualifiedName(), iterator);

            // Define necessary system declarations from which child declarations depend on
            if (!this.facts.graph_comingFrom.hasNode(iterator.getSuperType())) {
                this.facts.graph_comingFrom.addNode(iterator.getSuperType(), iterator.getSuperTypeDeclaration());
            }
            this.facts.graph_comingFrom.addDependency(iterator.getSuperType(), iterator.getFullyQualifiedName());
            this.facts.comingFromClassList.push(iterator.getFullyQualifiedName());
        }

        for (const iterator of classDeclarations_to) {
            this.facts.graph_goingTo.addNode(iterator.getFullyQualifiedName(), iterator);
            if (!this.facts.graph_goingTo.hasNode(iterator.getSuperType())) {
                this.facts.graph_goingTo.addNode(iterator.getSuperType(), iterator.getSuperTypeDeclaration());
            }
            this.facts.graph_goingTo.addDependency(iterator.getSuperType(), iterator.getFullyQualifiedName());
            this.facts.goingToClassList.push(iterator.getFullyQualifiedName());
        }
    }

    /**
     * @returns {Array} of Event objects for the failures
     */
    getFailureEvents() {
        return this.events.failure;
    }

    /**
     * @returns {Array} of Event objects for the successes
     */
    getSuccessEvents() {
        return this.events.success;
    }

    /**
     * @returns {Array} of Event objects for the warnings
     */
    getWarningEvents() {
        return this.events.warning;
    }

    /**
     *
     */
    async runRules() {

        const globalClassRules = require('./rule.js').globalClassRules;
        const perClassRules = require('./rule.js').perClassRules;

        await this.run(this.facts.comingFromClassList, this.facts.goingToClassList, globalClassRules);

        // Finds all fqdn that are the same in both lists
        let toCheck = _.intersection(this.facts.comingFromClassList, this.facts.goingToClassList);
        for (const iterator of toCheck) {
            await this.run(this.facts.graph_comingFrom.getNodeData(iterator), this.facts.graph_goingTo.getNodeData(iterator), perClassRules);
        }
    }

    /** Run the rules and store the events, and emit them as well.
     * @param {Object} from facts determining the from state
     * @param {Object} to facts determining the from to
     * @param {Object} rules to enforce
    */
    async run(from, to, rules) {
        let keys = Object.keys(rules);
        for (const iterator of keys) {
            let events = await rules[iterator](from, to);
            for (const event of events) {
                event.type = iterator;
                this.events[event.result].push(event);
                this.emit(event.result, event);
            }
        }
    }

    /**
      * Command process for deploy command
      * @param {string} args argument list from composer command
      * @return {Promise} promise when command complete
      */
    static handler(args) {

        cmdUtil.log(chalk.blue.bold('Business Network Archive Validation\n'));

        // Create MigrationChecker class instance and create events
        let checker = new MigrationChecker(args);

        checker.on('success', event => {
            cmdUtil.log(`${chalk.green('PASS')}: ${chalk.blue(JSON.stringify(event.data))} passed the ${chalk.blue(event.type)} rule`);
        })
        .on('failure', event => {
            cmdUtil.log(`${chalk.red('FAIL')}: ${chalk.blue(JSON.stringify(event.data))}  failed the ${chalk.blue(event.type)} rule`);
        })
        .on('warning', event => {
            cmdUtil.log(`${chalk.yellow('WARN')}: ${chalk.blue(JSON.stringify(event.data))}  triggered the ${chalk.blue(event.type)} rule`);
        });

        cmdUtil.log(`Checking migration of model \n\tfrom ${chalk.blue.bold(checker.fromFileName)} \n\tto  ${chalk.blue.bold(checker.toFileName)}\n`);
        return checker.loadNetworks()
          .then(()=>{
              return checker.runRules();
          })
          .then( ()=>{
              let failEvents = checker.getFailureEvents();
              let passEvents = checker.getSuccessEvents();
              let warnEvents = checker.getWarningEvents();
              cmdUtil.log(`\n\n${chalk.blue.bold('Summary:')}`);
              cmdUtil.log(`${chalk.green(passEvents.length)} Pass${(passEvents.length === 1) ? '' : 'es' }, ${chalk.red(failEvents.length)} Failure${(failEvents.length===1)?'':'s'}, ${chalk.yellow(warnEvents.length)} Warning${(warnEvents.length===1)?'':'s'}`);

              if (failEvents.length > 0) {
                  return Promise.reject('Model will not migrate cleanly');
              } else {
                  return Promise.resolve('Model will migrate');
              }
          });

    }
}

module.exports = MigrationChecker;
