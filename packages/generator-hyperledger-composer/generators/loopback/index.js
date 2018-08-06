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

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const fs = require('fs');
const LoopbackVisitor = require('composer-common').LoopbackVisitor;
const optionOrPrompt = require('yeoman-option-or-prompt');
const Util = require('../util');
const version = require('../../package.json').version;
const yeoman = require('yeoman-generator');

let businessNetworkConnectionOptions = undefined;

module.exports = class extends yeoman.Base {

    /**
     * Set the business network connection options.
     * @param {*} options The business network connection options.
     */
    static setBusinessNetworkConnectionOptions(options) {
        businessNetworkConnectionOptions = options;
    }

    /**
     * Constructor.
     */
    constructor() {
        super(...arguments);
        this._optionOrPrompt = optionOrPrompt.bind(this);
    }

    /**
     * Prompt for project specific options.
     * @returns {Object} The project specific options.
     */
    async _promptingProject() {
        return this._optionOrPrompt([{
            when: !this.options.appName,
            type: 'input',
            name: 'appName',
            message: 'Project name:',
            default: 'vue-app',
            store: true,
            validate: Util.validateAppName
        },
        {
            type: 'input',
            name: 'appDescription',
            message: 'Description:',
            default: 'Hyperledger Composer LoopBack project',
            store: true,
            validate: Util.validateDescription
        },
        {
            type: 'input',
            name: 'authorName',
            message: 'Author name:',
            store: true,
            validate: Util.validateAuthorName
        },
        {
            type: 'input',
            name: 'authorEmail',
            message: 'Author email:',
            store: true,
            validate: Util.validateAuthorEmail
        },
        {
            type: 'input',
            name: 'license',
            message: 'License:',
            default: 'Apache-2.0',
            store: true,
            validate: Util.validateLicense
        }]);
    }

    /**
     * Prompt for options specific to connecting to a live network.
     * @returns {Object} The options specific to connecting to a live network.
     */
    async _promptingLiveNetwork() {
        return this._optionOrPrompt([{
            type: 'input',
            name: 'cardName',
            message: 'Name of the Business Network card:',
            store: true,
            validate: Util.cardName
        }]);
    }

    /**
     * Prompt for options specific to using a business network archive.
     * @returns {Object} The options specific to using a business network archive.
     */
    async _promptingNetworkArchive() {
        return this._optionOrPrompt([{
            type: 'input',
            name: 'fileName',
            message: 'Business network archive file (Path from the current working directory):',
            default: 'digitalproperty-network.bna',
            store: true,
            validate: Util.validateBnaName
        }, {
            type: 'input',
            name: 'cardName',
            message: 'Name of the Business Network card:',
            store: true,
            validate: Util.cardName
        }]);
    }

    /**
     * Prompt the user for all of the options.
     */
    async prompting() {

        // Say hello!
        console.log('Welcome to the Hyperledger Composer LoopBack project generator');

        // Determine if the user wants to connect to a running business network.
        let answers = await this._optionOrPrompt([{
            type: 'confirm',
            name: 'liveNetwork',
            message: 'Do you want to connect to a running Business Network?',
            default: false,
            store: true
        }]);
        Object.assign(this, answers);

        // Ask questions about the project to generate.
        answers = await this._promptingProject();
        Object.assign(this, answers);

        // Ask questions about the business network.
        if (this.liveNetwork) {
            answers = await this._promptingLiveNetwork();
        } else {
            answers = await this._promptingNetworkArchive();
        }
        Object.assign(this, answers);

        // Store default values.
        this.version = version;

    }

    /**
     * Write all of the files to the file system.
     */
    async writing() {

        // Create a visitor.
        this.visitor = new LoopbackVisitor(false);

        // Get the business network definition.
        if (this.liveNetwork) {
            const businessNetworkConnection = new BusinessNetworkConnection(businessNetworkConnectionOptions);
            this.businessNetworkDefinition = await businessNetworkConnection.connect(this.cardName);
            await businessNetworkConnection.disconnect();
        } else {
            const businessNetworkArchive = fs.readFileSync(this.fileName);
            this.businessNetworkDefinition = await BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
        }

        // Set the destination root.
        this.destinationRoot(this.appName);

        // Load the list of types.
        const introspector = this.businessNetworkDefinition.getIntrospector();
        const classDeclarations = introspector.getClassDeclarations().filter((classDeclaration) => {
            return !classDeclaration.isAbstract() &&
                   !classDeclaration.isSystemType() &&
                   !classDeclaration.isEvent() &&
                   !classDeclaration.isEnum();
        });

        // Copy the skeleton project into place.
        this.fs.copyTpl(this.templatePath('skeleton'), this.destinationRoot(), this, undefined, { globOptions: { dot: true } });

        // Create the model files.
        await this._writingModelFiles(classDeclarations);

        // Create the connector configuration.
        await this._writingConnectorConfiguration();

        // Create the model configuration.
        await this._writingModelConfiguration(classDeclarations);

    }

    /**
     * Write all of the LoopBack model files to the file system.
     * @param {ClassDeclaration[]} classDeclarations The class declarations.
     */
    async _writingModelFiles(classDeclarations) {
        for (const classDeclaration of classDeclarations) {
            await this._writingModelFile(classDeclaration);
        }
    }

    /**
     * Write a LoopBack model file to the file system.
     * @param {ClassDeclaration} classDeclaration The class declaration.
     */
    async _writingModelFile(classDeclaration) {
        const name = classDeclaration.getName();
        const schema = classDeclaration.accept(this.visitor, { first: true });
        const json = JSON.stringify(schema, null, 2);
        this.fs.write(this.destinationPath(`common/models/${name}.json`), json);
        const js = '\'use strict\';\n' +
            '\n' +
            'const Composer = require(\'../lib/composer.js\');\n' +
            '\n' +
            `module.exports = function(${name}) {\n` +
            `  Composer.restrictModelMethods(${name});\n` +
            '};\n';
        this.fs.write(this.destinationPath(`common/models/${name}.js`), js);
    }

    /**
     * Write the LoopBack connector configuration to the file system.
     */
    async _writingConnectorConfiguration() {
        const datasources = {
            composer: {
                name: 'composer',
                connector: 'loopback-connector-composer',
                card: this.cardName,
                namespaces: false
            }
        };
        const json = JSON.stringify(datasources, null, 2);
        this.fs.delete(this.destinationPath('server/datasources.json'));
        this.fs.write(this.destinationPath('server/datasources.json'), json);
    }

    /**
     * Write the LoopBack model configuration to the file system.
     * @param {ClassDeclaration[]} classDeclarations The class declarations.
     */
    async _writingModelConfiguration(classDeclarations) {
        const modelConfig = this.fs.readJSON(this.destinationPath('server/model-config.json'));
        for (const classDeclaration of classDeclarations) {
            const name = classDeclaration.getName();
            modelConfig[name] = {
                dataSource: 'composer',
                public: true
            };
        }
        const json = JSON.stringify(modelConfig, null, 2);
        this.fs.delete(this.destinationPath('server/model-config.json'));
        this.fs.write(this.destinationPath('server/model-config.json'), json);
    }

    /**
     * Install project dependencies so that the project can be run.
     */
    async install() {
        await this.installDependencies({
            bower: false,
            npm: true
        });
    }

};