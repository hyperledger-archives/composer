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

const ModelManager = require('./modelmanager');
const Introspector = require('./introspect/introspector');
const Factory = require('./factory');
const Serializer = require('./serializer');
const ScriptManager = require('./scriptmanager');
const JSZip = require('jszip');
// const fs = require('fs');
/**
 * <p>
 * A BusinessNetwork defines a set of Participants that exchange Assets by
 * sending Transactions. This class manages the metadata and domain-specific types for
 * the network as well as a set of executable scripts.
 * </p>
 */
class BusinessNetwork {

    /**
     * Create the BusinessNetwork.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetwork.fromArchive}</strong>
     * </p>
     * @param {String} identifier  - the identifier of the business network
     * @param {String} description  - the description of the business network
     */
    constructor(identifier, description) {
        this.identifier = identifier;
        this.description = description;
        this.modelManager = new ModelManager();
        this.scriptManager = new ScriptManager(this.modelManager);
        this.introspector = new Introspector(this.modelManager);
        this.factory = new Factory(this.modelManager);
        this.serializer = new Serializer(this.factory, this.modelManager);
    }

    /**
     * Returns the identifier for this business network
     * @return {String} the identifier of this business network
     */
    getIdentifier() {
        return this.identifier;
    }

    /**
     * Returns the description for this business network
     * @return {String} the description of this business network
     */
    getDescription() {
        return this.description;
    }

    /**
     * Create a BusinessNetwork from an archive.
     * @param {Buffer} Buffer  - the zlib buffer
     * @return {Promise} a Promise to the instantiated business network
     */
    static fromArchive(Buffer) {
        return JSZip.loadAsync(Buffer).then(function(zip){

            const result = new BusinessNetwork('identifier', 'description' );

            const allPromises = [];
            let ctoModelFiles = [];
            let jsObjectArray = [];

            let ctoFiles = zip.file(/models\/.*\.cto$/); //Matches any file which is in the 'models' folder and has a .cto extension
            ctoFiles.forEach(function(file){
                const ctoPromise = file.async('string');
                allPromises.push(ctoPromise);
                ctoPromise.then(contents => {
                    ctoModelFiles.push(contents);
                });
            });

            let jsFiles = zip.file(/lib\/.*\.js$/); //Matches any file which is in the 'lib' folder and has a .js extension
            jsFiles.forEach(function(file){
                const jsPromise = file.async('string');
                allPromises.push(jsPromise);
                jsPromise.then(contents => {
                    let jsObject = result.scriptManager.createScript(file.name,'js', contents);
                    jsObjectArray.push(jsObject);

                });
            });

            return Promise.all(allPromises)
            .then(() => {
                result.modelManager.addModelFiles(ctoModelFiles); // Adds all cto files to model manager
                // console.log('What are the jsObjectsArray?',jsObjectArray);
                jsObjectArray.forEach(function(object){
                    result.scriptManager.addScript(object); // Adds all js files to script manager
                });

                return result; // Returns business network (with model manager and script manager)
            });
        });
    }

    /**
     * Store a BusinessNetwork as an archive.
     * @return {Buffer} buffer  - the zlib buffer
     */
    toArchive() {

        let zip = new JSZip();

        let modelManager = this.getModelManager();
        let modelFiles = modelManager.getModelFiles();
        modelFiles.forEach(function(file){
            zip.folder('models').file(file.namespace+'.cto',file.definitions);
        });

        let scriptManager = this.getScriptManager();
        let scriptFiles = scriptManager.getScripts();
        scriptFiles.forEach(function(file){
            let fileIdentifier = file.identifier;
            let fileName = fileIdentifier.substring(fileIdentifier.lastIndexOf('/')+1);
            zip.folder('lib').file(fileName,file.contents);
        });

        return zip.generateAsync({
            type: 'nodebuffer'
        }).then(something => {
            return Promise.resolve(something).then(result=>{
                return result;
            });

        });

    }
    // /**
    //  * From Directory
    //  * @param {String} path to a local directory
    //  * @return {Buffer} zip file
    //  */
    // fromDirectory(path){
    //     const allPromises = [];
    //     let ctoModelFiles = [];
    //     let jsScriptFiles = [];
    //     const result = new BusinessNetwork('identifier', 'description' );
    //
    //     let workingDir = path.substring(path.lastIndexOf('/')+1);
    //
    //     let walk = function(dir) {
    //         let results = [];
    //         let list = fs.readdirSync(dir);
    //         list.forEach(function(file) {
    //             file = dir + '/' + file;
    //             let stat = fs.statSync(file);
    //             if (stat && stat.isDirectory()) {results = results.concat(walk(file));}
    //             else {
    //                 results.push(file);
    //
    //             }
    //         });
    //         return results;
    //     };
    //     let readFolder = walk(path);
    //
    //     let ctoFiles = [];
    //     let jsFiles = [];
    //     let regex = new RegExp(`${workingDir}/lib/.*\.js$`);
    //     readFolder.forEach(function(file){
    //         if(file.match(/.*\.cto$/)){
    //             ctoFiles.push(file);
    //         }
    //         else if(file.match(regex)){
    //             jsFiles.push(file);
    //         }
    //     });
    //
    //     // console.log('what are the cto files?',ctoFiles);
    //     // console.log('what are the js files?',jsFiles);
    //     ctoFiles.forEach(function(file){
    //         const ctoPromise = new Promise((resolve,reject)=>{
    //             fs.readFile(file, (err, data) => {
    //                 if(err){
    //                     reject(err);
    //                 }
    //                 resolve(data);
    //             });
    //         });
    //         allPromises.push(ctoPromise);
    //         ctoPromise.then(contents => {
    //             let contentsToString = contents.toString('utf8');
    //             ctoModelFiles.push(contentsToString);
    //         });
    //     });
    //
    //     jsFiles.forEach(function(file){
    //         // console.log('for file',file);
    //         const jsPromise = new Promise((resolve,reject)=>{
    //             fs.readFile(file, (err, data) => {
    //                 if(err){
    //                     reject(err);
    //                 }
    //                 resolve(data);
    //             });
    //         });
    //         allPromises.push(jsPromise);
    //         jsPromise.then(contents => {
    //             let contentsToString = contents.toString('utf8');
    //             let jsScript = result.scriptManager.createScript(file, 'js', contentsToString);
    //             jsScriptFiles.push(jsScript);
    //
    //         });
    //
    //     });
    //
    //     return Promise.all(allPromises)
    //     .then(() => {
    //
    //
    //         result.modelManager.addModelFiles(ctoModelFiles); // Adds all cto files to model manager
    //
    //
    //         jsScriptFiles.forEach(function(object){
    //             result.scriptManager.addScript(object); // Adds all js files to script manager
    //         });
    //
    //         return result; // Returns business network (with model manager and script manager)
    //     });
    //
    // }

    /**
     * Visitor design pattern
     * @param {Object} visitor - the visitor
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    accept(visitor,parameters) {
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
     * Provides access to the ModelManager for this business network. The ModelManager
     * manage access to the models that have been defined within this business network.
     * @return {ModelManager} the ModelManager for this business network
     * @private
     */
    getModelManager() {
        return this.modelManager;
    }
}

module.exports = BusinessNetwork;
