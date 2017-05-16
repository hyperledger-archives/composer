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

const fs = require('fs');
const fsPath = require('path');
const Logger = require('../log/logger');
const minimatch = require('minimatch');

const LOG = Logger.getLog('ModelCollector');
const ENCODING = 'utf8';

/**
 * ModelCollector collects all the CTO files for an npm module
 * along with all its transitive dependencies declared in package.json
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class ModelCollector {

    /**
     * Create a ModelCollector. Call the collect method to aggregate information
     * about the model files in memory.
     */
    constructor() {
    }

    /**
     * Collect
     *
     * @param {string} path - the path to process
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @param {Object} [options.dependencyGlob] - specify the glob pattern used to match
     * the npm dependencies to process. Defaults to **
     * @param {boolean} [options.modelFileGlob] - specify the glob pattern used to match
     * the model files to include. Defaults to **\/models/**\/*.cto
     * @param {boolean} [options.scriptGlob] - specify the glob pattern used to match
     * the script files to include. Defaults to **\/lib/**\/*.js
     * @return {Object[]} an array of objects that describe the models
     * @private
     */
    collect(path, options) {
        const method = 'collect';

        if (!options) {
            options = {};
        }

        if (!options.dependencyGlob) {
            options.dependencyGlob = '**';
        }

        if (!options.modelFileGlob) {
            options.modelFileGlob = '**/models/**/*.cto';
        }

        // grab the package.json
        let packageJsonContents = fs.readFileSync(fsPath.resolve(path, 'package.json'), ENCODING);

        if (!packageJsonContents) {
            throw new Error('Failed to find package.json');
        }

        LOG.debug(method, 'Loaded package.json', packageJsonContents);

        // parse the package.json
        let jsonObject = JSON.parse(packageJsonContents);
        let packageName = jsonObject.name;
        const modelFiles = [];

        // grab all the model files that are beneath the current directory
        ModelCollector.processDirectory(path, {
            accepts: function (file) {
                return minimatch(file, options.modelFileGlob, { dot: true });
            },
            acceptsDir: function (dir) {
                return true;
            },
            process: function (pathToContents, contents) {
                modelFiles.push({
                    'module': packageName,
                    'file': fsPath.basename(pathToContents),
                    'path': pathToContents,
                    'relativePath' : fsPath.relative(path,pathToContents),
                    'contents': contents
                });
                LOG.debug(method, 'Found model file', pathToContents);
            }
        });

        // we then process each of the dependencies
        if (jsonObject.dependencies) {
            LOG.debug(method, 'All dependencies', Object.keys(jsonObject.dependencies).toString());
            const dependencies = Object.keys(jsonObject.dependencies).filter(minimatch.filter(options.dependencyGlob, { dot: true }));
            LOG.debug(method, 'Matched dependencies', dependencies);

            for (let dep of dependencies) {
                let dependencyPath = fsPath.resolve(path, 'node_modules', dep);
                LOG.debug(method, 'Checking dependency path', dependencyPath);
                if (!fs.existsSync(dependencyPath)) {
                    // need to check to see if this is in a peer directory as well
                    LOG.debug(method, 'trying different path ' + path.replace(packageName, ''));
                    dependencyPath = fsPath.resolve(path.replace(packageName, ''), dep);
                    if (!fs.existsSync(dependencyPath)) {
                        throw new Error('npm dependency path ' + dependencyPath + ' does not exist. Did you run npm install?');
                    }
                }

                // collect everything in the dependency path
                modelFiles.concat(this.collect(dependencyPath, options));
            }
        }

        return modelFiles;
    }

    /**
     * @param {String} path - the path to process
     * @param {Object} fileProcessor - the file processor. It must have
     * accept and process methods.
     * @private
     */
    static processDirectory(path, fileProcessor) {
        const items = ModelCollector.walkSync(path, [], fileProcessor);
        items.sort();
        LOG.debug('processDirectory', 'Path ' + path, items);
        items.forEach((item) => {
            ModelCollector.processFile(item, fileProcessor);
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
            LOG.debug('processFile', 'FileProcessor accepted', file);
            let fileContents = fs.readFileSync(file, ENCODING);
            fileProcessor.process(file, fileContents);
        } else {
            LOG.debug('processFile', 'FileProcessor rejected', file);
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
                    filelist = ModelCollector.walkSync(nestedPath, filelist, fileProcessor);
                }
            } else {
                filelist.push(nestedPath);
            }
        });
        return filelist;
    }
}

module.exports = ModelCollector;
