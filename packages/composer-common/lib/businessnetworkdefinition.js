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

const AclFile = require('./acl/aclfile');
const AclManager = require('./aclmanager');
const QueryFile = require('./query/queryfile');
const QueryManager = require('./querymanager');
const BusinessNetworkMetadata = require('./businessnetworkmetadata');
const Factory = require('./factory');
const fs = require('fs');
const fsPath = require('path');
const Introspector = require('./introspect/introspector');
const JSZip = require('jszip');
const Logger = require('./log/logger');
const ModelManager = require('./modelmanager');
const minimatch = require('minimatch');
const ScriptManager = require('./scriptmanager');
const semver = require('semver');
const Serializer = require('./serializer');
const ENCODING = 'utf8';
const LOG = Logger.getLog('BusinessNetworkDefinition');

/**
 * <p>
 * A BusinessNetworkDefinition defines a set of Participants that exchange Assets by
 * sending Transactions. This class manages the metadata and domain-specific types for
 * the network as well as a set of executable scripts.
 * </p>
 * @class
 * @memberof module:composer-common
 */
class BusinessNetworkDefinition {

    /**
     * Create the BusinessNetworkDefinition.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetworkDefinition.fromArchive}</strong>
     * </p>
     * @param {String} identifier  - the identifier of the business network. The
     * identifier is formed from a business network name + '@' + version. The
     * version is a semver valid version string. If package.json is passed this is ignored.
     * @param {String} description  - the description of the business network. If package.json is passed then this is ignored.
     * @param {object} packageJson  - the JS object for package.json (optional)
     * @param {String} readme  - the readme in markdown for the business network (optional)
     */
    constructor(identifier, description, packageJson, readme) {
        const method = 'constructor';
        LOG.entry(method, identifier, description);

        // if package.json is not present we generate one based on the metadata passed
        if(!packageJson) {
            const atIndex = identifier.lastIndexOf('@');
            let name = null;

            if (atIndex >= 0) {
                name = identifier.substring(0, atIndex);
            } else {
                throw new Error('Malformed business network identifier. It must be "name@major.minor.micro"');
            }

            const version = identifier.substring(atIndex + 1);
            if (!semver.valid(version)) {
                throw new Error('Version number is invalid. Should be valid according to semver but found: ' + version);
            }

            packageJson = {};
            packageJson.name = name;
            packageJson.version = version;
            packageJson.description = description;
            LOG.debug(method, 'Created package.json' + JSON.stringify(packageJson));
        }
        else {
            LOG.debug(method, 'Using package.json' + JSON.stringify(packageJson));
        }

        this.modelManager = new ModelManager();
        this.aclManager = new AclManager(this.modelManager);
        this.queryManager = new QueryManager(this.modelManager);
        this.scriptManager = new ScriptManager(this.modelManager);
        this.introspector = new Introspector(this.modelManager);
        this.factory = new Factory(this.modelManager);
        this.serializer = new Serializer(this.factory, this.modelManager);

        this.metadata = new BusinessNetworkMetadata(packageJson,readme);
        LOG.exit(method);
    }

    /**
     * Returns the identifier for this business network
     * @return {String} the identifier of this business network
     */
    getIdentifier() {
        return this.getMetadata().getIdentifier();
    }

    /**
     * Returns the metadata for this business network
     * @return {BusinessNetworkMetadata} the metadata for this business network
     */
    getMetadata() {
        return this.metadata;
    }

    /**
     * Returns the name for this business network
     * @return {String} the name of this business network
     */
    getName() {
        return this.getMetadata().getName();
    }

    /**
     * Returns the version for this business network
     * @return {String} the version of this business network. Use semver module
     * to parse.
     */
    getVersion() {
        return this.getMetadata().getVersion();
    }


    /**
     * Returns the description for this business network
     * @return {String} the description of this business network
     */
    getDescription() {
        return this.getMetadata().getDescription();
    }

    /**
     * Create a BusinessNetworkDefinition from an archive.
     * @param {Buffer} Buffer  - the Buffer to a zip archive
     * @return {Promise} a Promise to the instantiated business network
     */
    static fromArchive(Buffer) {
        const method = 'fromArchive';
        LOG.entry(method, Buffer.length);
        return JSZip.loadAsync(Buffer).then(function(zip) {
            let promise = Promise.resolve();
            let ctoModelFiles = [];
            let ctoModelFileNames = [];
            let jsScriptFiles = [];
            let permissionsFiles = [];
            let queriesFiles = [];
            let businessNetworkDefinition;
            let readmeContents = null;
            let packageJsonContents = null;

            LOG.debug(method, 'Loading README.md');
            let readme = zip.file('README.md');
            if(readme) {
                promise = promise.then(() => {
                    return readme.async('string');
                }).then((contents) => {
                    LOG.debug(method, 'Loaded README.md');
                    readmeContents = contents;
                });
            }

            LOG.debug(method, 'Loading package.json');
            let packageJson = zip.file('package.json');
            if (packageJson === null) {
                throw Error('package.json must exist');
            }
            promise = promise.then(() => {
                return packageJson.async('string');
            }).then((contents) => {
                LOG.debug(method, 'Loaded package.json');
                packageJsonContents = JSON.parse(contents);
            });

            LOG.debug(method, 'Looking for model files');
            let ctoFiles = zip.file(/models\/.*\.cto$/); //Matches any file which is in the 'models' folder and has a .cto extension
            ctoFiles.forEach(function(file) {
                LOG.debug(method, 'Found model file, loading it', file.name);
                ctoModelFileNames.push(file.name);
                promise = promise.then(() => {
                    return file.async('string');
                }).then((contents) => {
                    LOG.debug(method, 'Loaded model file');
                    ctoModelFiles.push(contents);
                });
            });

            LOG.debug(method, 'Looking for JavaScript files');
            let jsFiles = zip.file(/lib\/.*\.js$/); //Matches any file which is in the 'lib' folder and has a .js extension
            jsFiles.forEach(function(file) {
                LOG.debug(method, 'Found JavaScript file, loading it', file.name);
                promise = promise.then(() => {
                    return file.async('string');
                }).then((contents) => {
                    LOG.debug(method, 'Loaded JavaScript file');
                    let tempObj = {
                        'name': file.name,
                        'contents': contents
                    };
                    jsScriptFiles.push(tempObj);

                });
            });

            LOG.debug(method, 'Loading permissions.acl');
            let aclFile = zip.file('permissions.acl');
            if (aclFile !== null) {
                promise = promise.then(() => {
                    return aclFile.async('string');
                }).then(contents => {
                    LOG.debug(method, 'Loaded permissions.acl');
                    permissionsFiles.push(contents);
                });
            }

            LOG.debug(method, 'Loading query queries.qry');
            let queryFile = zip.file('queries.qry');
            if (queryFile !== null) {
                promise = promise.then(() => {
                    return queryFile.async('string');
                }).then(contents => {
                    LOG.debug(method, 'Loaded queries.qry');
                    queriesFiles.push(contents);
                });
            }

            return promise.then(() => {
                LOG.debug(method, 'Loaded package.json');
                businessNetworkDefinition = new BusinessNetworkDefinition(null, null, packageJsonContents, readmeContents);

                LOG.debug(method, 'Loaded all model, JavaScript, ACL files and Query files');
                LOG.debug(method, 'Adding model files to model manager');
                businessNetworkDefinition.modelManager.addModelFiles(ctoModelFiles,ctoModelFileNames); // Adds all cto files to model manager
                LOG.debug(method, 'Added model files to model manager');
                    // console.log('What are the jsObjectsArray?',jsObjectArray);
                LOG.debug(method, 'Adding JavaScript files to script manager');
                jsScriptFiles.forEach(function(obj) {
                    let jsObject = businessNetworkDefinition.scriptManager.createScript(obj.name, 'js', obj.contents);
                    businessNetworkDefinition.scriptManager.addScript(jsObject); // Adds all js files to script manager
                });
                LOG.debug(method, 'Added JavaScript files to script manager');
                LOG.debug(method, 'Adding ACL files to ACL manager');
                permissionsFiles.forEach((permissionFile) => {
                    businessNetworkDefinition.getAclManager().setAclFile( new AclFile('permissions.acl', businessNetworkDefinition.getModelManager(), permissionFile));
                });
                LOG.debug(method, 'Added ACL files to ACL manager');
                LOG.debug(method, 'Adding Query files to query manager');
                queriesFiles.forEach((queryFile) => {
                    businessNetworkDefinition.getQueryManager().setQueryFile( new QueryFile('queries.qry', businessNetworkDefinition.getModelManager(), queryFile));
                });
                LOG.debug(method, 'Added Query files to query manager');

                LOG.exit(method, businessNetworkDefinition.toString());
                return businessNetworkDefinition; // Returns business network (with model manager and script manager)
            });
        });
    }

    /**
     * Store a BusinessNetworkDefinition as an archive.
     * @param {Object} [options]  - JSZip options
     * @return {Buffer} buffer  - the zlib buffer
     */
    toArchive(options) {

        let zip = new JSZip();

        let packageFileContents = JSON.stringify(this.getMetadata().getPackageJson());
        zip.file('package.json', packageFileContents, options);

        // save the README.md if present
        if(this.getMetadata().getREADME()) {
            zip.file('README.md', this.getMetadata().getREADME(), options);
        }

        const aclFile = this.getAclManager().getAclFile();
        if(aclFile) {
            zip.file(aclFile.getIdentifier(), aclFile.definitions, options);
        }

        const queryFile = this.getQueryManager().getQueryFile();
        if(queryFile) {
            zip.file(queryFile.getIdentifier(), queryFile.definitions, options);
        }

        let modelManager = this.getModelManager();
        let modelFiles = modelManager.getModelFiles();
        zip.file('models/', null, Object.assign({}, options, { dir: true }));
        modelFiles.forEach(function(file) {
            let fileName;
            // ignore the system namespace when creating an archive
            if (file.isSystemModelFile()){
                return;
            }
            if (file.fileName === 'UNKNOWN'  || file.fileName === null || !file.fileName) {
                fileName = file.namespace + '.cto';
            } else {
                let fileIdentifier = file.fileName;
                fileName = fsPath.parse(fileIdentifier).base;
            }
            zip.file('models/' + fileName, file.definitions, options);
        });

        let scriptManager = this.getScriptManager();
        let scriptFiles = scriptManager.getScripts();
        zip.file('lib/', null, Object.assign({}, options, { dir: true }));
        scriptFiles.forEach(function(file) {
            let fileIdentifier = file.identifier;
            let fileName = fsPath.parse(fileIdentifier).base;
            zip.file('lib/' + fileName, file.contents, options);
        });

        return zip.generateAsync({
            type: 'nodebuffer'
        }).then(something => {
            return Promise.resolve(something).then(result => {
                return result;
            });

        });

    }

    /**
     * Builds a BusinessNetworkDefintion from the contents of a directory.
     * The directory must include a package.json in the root (used to specify
     * the name, version and description of the business network). This method
     * is designed to work with business networks that refer to external models
     * using npm dependencies as well as business networks that statically
     * package their model files.
     * <p>
     * If package.json contains a dependencies property then this method will search for
     * model (CTO) files under the node_modules directory for each dependency that
     * passes the options.dependencyGlob pattern.
     * </p>
     * <p>
     * If the network depends on an npm module its dependencies (transitive closure)
     * will also be scanned for model (CTO) files.
     * </p>
     * <p>
     * The directory may optionally contain a README.md file which is accessible from the
     * BusinessNetworkMetadata.getREADME method.
     * </p>
     * <p>
     * In addition all model files will be added that are not under node_modules
     * and that pass the options.modelFileGlob pattern. By default you should put
     * model files under a directory called 'models'.
     * </p>
     * <p>
     * All script (js) files will be added that are not under node_modules and
     * that pass the options.scriptGlob pattern. By default you should put Javascript
     * files under the 'lib' directory.
     * </p>
     *
     * @param {String} path to a local directory
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {Object} [options.dependencyGlob] - specify the glob pattern used to match
     * the npm dependencies to process. Defaults to **
     * @param {boolean} [options.modelFileGlob] - specify the glob pattern used to match
     * the model files to include. Defaults to **\/models/**\/*.cto
     * @param {boolean} [options.scriptGlob] - specify the glob pattern used to match
     * the script files to include. Defaults to **\/lib/**\/*.js
     * @return {Promise} a Promise to the instantiated business network
     */
    static fromDirectory(path, options) {

        if(!options) {
            options = {};
        }

        if(!options.dependencyGlob) {
            options.dependencyGlob = '**';
        }

        if(!options.modelFileGlob) {
            options.modelFileGlob = '**/models/**/*.cto';
        }

        if(!options.scriptGlob) {
            options.scriptGlob = '**/lib/**/*.js';
        }

        const method = 'fromDirectory';
        LOG.entry(method, path);

         // grab the README.md
        let readmeContents = null;
        const readmePath = fsPath.resolve(path, 'README.md');
        if(fs.existsSync(readmePath)) {
            readmeContents = fs.readFileSync(readmePath, ENCODING);
            if(readmeContents) {
                LOG.debug(method, 'Loaded README.md', readmeContents);
            }
        }

        // grab the package.json
        let packageJsonContents = fs.readFileSync( fsPath.resolve(path, 'package.json'), ENCODING);

        if(!packageJsonContents) {
            throw new Error('Failed to find package.json');
        }

        LOG.debug(method, 'Loaded package.json', packageJsonContents);

        // parse the package.json
        let jsonObject = JSON.parse(packageJsonContents);
        let packageName = jsonObject.name;

        // create the business network definition
        const businessNetwork = new BusinessNetworkDefinition(null, null, jsonObject, readmeContents);
        const modelFiles = [];
        const modelFileNames = [];

        // define a help function that will filter out files
        // that are inside a node_modules directory under the path
        // we are processing
        const isFileInNodeModuleDir = function(file, basePath) {
            const method = 'isFileInNodeModuleDir';
            let filePath = fsPath.parse(file);
            let subPath = filePath.dir.substring(basePath.length);
            let result = subPath.split(fsPath.sep).some((element) => {
                return element === 'node_modules';
            });

            LOG.debug(method, file, result);
            return result;
        };

        // process each module dependency
        // filtering using a glob on the module dependency name
        if(jsonObject.dependencies) {
            LOG.debug(method, 'All dependencies', Object.keys(jsonObject.dependencies).toString());
            const dependencies = Object.keys(jsonObject.dependencies).filter(minimatch.filter(options.dependencyGlob, { dot: true }));
            LOG.debug(method, 'Matched dependencies', dependencies);

            for( let dep of dependencies) {
                // find all the *.cto files under the npm install dependency path
                let dependencyPath = fsPath.resolve(path, 'node_modules', dep);
                LOG.debug(method, 'Checking dependency path', dependencyPath);
                if (!fs.existsSync(dependencyPath)) {
                    // need to check to see if this is in a peer directory as well
                    //
                    LOG.debug(method,'trying different path '+path.replace(packageName,''));
                    dependencyPath = fsPath.resolve(path.replace(packageName,''),dep);
                    if(!fs.existsSync(dependencyPath)){
                        throw new Error('npm dependency path ' + dependencyPath + ' does not exist. Did you run npm install?');
                    }
                }

                BusinessNetworkDefinition.processDirectory(dependencyPath, {
                    accepts: function(file) {
                        return isFileInNodeModuleDir(file, dependencyPath) === false && minimatch(file, options.modelFileGlob, { dot: true });
                    },
                    acceptsDir: function(dir) {
                        return !isFileInNodeModuleDir(dir, dependencyPath);
                    },
                    process: function(path,contents) {
                        modelFiles.push(contents);
                        modelFileNames.push(path);
                        LOG.debug(method, 'Found model file', path);
                    }
                });
            }
        }

        // find CTO files outside the npm install directory
        //
        BusinessNetworkDefinition.processDirectory(path, {
            accepts: function(file) {
                return isFileInNodeModuleDir(file, path) === false && minimatch(file, options.modelFileGlob, { dot: true });
            },
            acceptsDir: function(dir) {
                return !isFileInNodeModuleDir(dir, path);
            },
            process: function(path,contents) {
                modelFiles.push(contents);
                modelFileNames.push(path);
                LOG.debug(method, 'Found model file', path);
            }
        });

        businessNetwork.getModelManager().addModelFiles(modelFiles,modelFileNames);
        LOG.debug(method, 'Added model files',  modelFiles.length);

        // find script files outside the npm install directory
        const scriptFiles = [];
        BusinessNetworkDefinition.processDirectory(path, {
            accepts: function(file) {
                return isFileInNodeModuleDir(file, path) === false && minimatch(file, options.scriptGlob, { dot: true });
            },
            acceptsDir: function(dir) {
                return !isFileInNodeModuleDir(dir, path);
            },
            process: function(path,contents) {
                let filePath = fsPath.parse(path);
                const jsScript = businessNetwork.getScriptManager().createScript(path, filePath.ext.toLowerCase(), contents);
                scriptFiles.push(jsScript);
                LOG.debug(method, 'Found script file ', path);
            }
        });

        if(modelFiles.length === 0) {
            throw new Error('Failed to find a model file.');
        }

        for( let script of scriptFiles) {
            businessNetwork.getScriptManager().addScript(script);
        }

        LOG.debug(method, 'Added script files', scriptFiles.length);

        // grab the permissions.acl
        const aclPath = fsPath.resolve(path, 'permissions.acl');
        if(fs.existsSync(aclPath)) {
            let permissionsAclContents = fs.readFileSync( aclPath, ENCODING);

            if(permissionsAclContents) {
                LOG.debug(method, 'Loaded permissions.acl', permissionsAclContents);
                const aclFile = new AclFile('permissions.acl', businessNetwork.getModelManager(), permissionsAclContents);
                businessNetwork.getAclManager().setAclFile(aclFile);
            }
        }

         // grab the queries.qry
        const queryPath = fsPath.resolve(path, 'queries.qry');
        if(fs.existsSync(queryPath)) {
            let queryContents = fs.readFileSync( queryPath, ENCODING);

            if(queryContents) {
                LOG.debug(method, 'Loaded queries.qry', queryContents);
                const queryFile = new QueryFile('queries.qry', businessNetwork.getModelManager(), queryContents);
                businessNetwork.getQueryManager().setQueryFile(queryFile);
            }
        }


        LOG.exit(method, path);
        return Promise.resolve(businessNetwork);
    }

    /**
     * @param {String} path - the path to process
     * @param {Object} fileProcessor - the file processor. It must have
     * accept and process methods.
     * @private
     */
    static processDirectory(path, fileProcessor) {
        const items = BusinessNetworkDefinition.walkSync(path, [], fileProcessor);
        items.sort();
        LOG.debug('processDirectory', 'Path ' + path, items);
        items.forEach((item) => {
            BusinessNetworkDefinition.processFile(item, fileProcessor);
        });
    }

    /**
     * @param {String} file - the file to process
     * @param {Object} fileProcessor - the file processor. It must have
     * accepts and process methods.
     * @private
     */
    static processFile(file, fileProcessor) {

        if (fileProcessor.accepts(file)) {
            LOG.debug('processFile', 'FileProcessor accepted', file );
            let fileContents = fs.readFileSync(file, ENCODING);
            fileProcessor.process(file, fileContents);
        }
        else {
            LOG.debug('processFile', 'FileProcessor rejected', file );
        }
    }


    /**
     * @param {String} dir - the dir to walk
     * @param {Object[]} filelist - input files
     * @param {Object} fileProcessor - the file processor. It must have
     * accepts and process methods.
     * @return {Object[]} filelist - output files
     * @private
     */
    static walkSync(dir, filelist, fileProcessor) {
        let files = fs.readdirSync(dir);
        files.forEach(function (file) {
            let nestedPath = fsPath.join(dir, file);
            if (fs.lstatSync(nestedPath).isDirectory()) {
                if (fileProcessor.acceptsDir(nestedPath)) {
                    filelist = BusinessNetworkDefinition.walkSync(nestedPath, filelist, fileProcessor);
                }
            } else {
                filelist.push(nestedPath);
            }
        });
        return filelist;
    }


    /**
     * Visitor design pattern
     * @param {Object} visitor - the visitor
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    accept(visitor, parameters) {
        return visitor.visit(this, parameters);
    }

    /**
     * Provides access to the Introspector for this business network. The Introspector
     * is used to reflect on the types defined within this business network.
     * @return {Introspector} the Introspector for this business network
     */
    getIntrospector() {
        return this.introspector;
    }

    /**
     * Provides access to the Factory for this business network. The Factory
     * is used to create the types defined in this business network.
     * @return {Factory} the Factory for this business network
     */
    getFactory() {
        return this.factory;
    }

    /**
     * Provides access to the Serializer for this business network. The Serializer
     * is used to serialize instances of the types defined within this business network.
     * @return {Serializer} the Serializer for this business network
     */
    getSerializer() {
        return this.serializer;
    }

    /**
     * Provides access to the ScriptManager for this business network. The ScriptManager
     * manage access to the scripts that have been defined within this business network.
     * @return {ScriptManager} the ScriptManager for this business network
     * @private
     */
    getScriptManager() {
        return this.scriptManager;
    }

    /**
     * Provides access to the AclManager for this business network. The AclManager
     * manage access to the access conrol rules that have been defined for this business network.
     * @return {AclManager} the AclManager for this business network
     * @private
     */
    getAclManager() {
        return this.aclManager;
    }

    /**
     * Provides access to the ModelManager for this business network. The ModelManager
     * manage access to the models that have been defined within this business network.
     * @return {ModelManager} the ModelManager for this business network
     * @private
     */
    getModelManager() {
        return this.modelManager;
    }

    /**
     * Provides access to the QueryManager for this business network. The QueryManager
     * manage access to the models that have been defined within this business network.
     * @return {QueryManager} the QueryManager for this business network
     * @private
     */
    getQueryManager() {
        return this.queryManager;
    }

}

module.exports = BusinessNetworkDefinition;
