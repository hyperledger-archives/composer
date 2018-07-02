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

const parser = require('../parsers/modelfile-cmts.js');
const doctrine = require('doctrine');
const path = require('path');
const fs = require('fs');

/**
 * Merges the additional tags located from the comment with those already parses
 * @param {Object} resource class declaration currently being processed
 * @param {Object[]} tags array of tags to be added to the resource (if parameters)
 */
function tagMerge(resource,tags){

    for (let t=0; t<tags.length; t++){
        if (tags[t].title === 'param'){
            let desc = tags[t].description;
            let name = tags[t].name;
            if (resource.properties[name]){
                resource.properties[name].description = desc;
            }
        }
    }

}


/**
 * Takes care of the class declarations
 *
 * @param {Object} context add the details to this for the template
 * @param {Object} options any additional options
 * @param {Object} options.docPrefix the prefix for the location of any @docs() decorators
 * @return {Object} the updated context
 */
function classdeclarations(context,options){

    let data = {};
    let introspector = context._bnd.getIntrospector();
    let modelFiles = introspector.getModelManager().getModelFiles();
    for(let n=0; n < modelFiles.length; n++) {
        const modelFile = modelFiles[n];
        let ns = modelFile.getNamespace();
        let output = parser.parse(modelFile.definitions);

        for (const [key, value] of Object.entries(output)) {
            let name = `${ns}.${key}`;
            data[name]= doctrine.parse(value,{sloppy:true,unwrap:true});
        }

    }

    ['asset','concept','transaction','enum','participant','event'].forEach((t)=>{
        // need to added the parsed comments to the existing structure

        // context.types[t] gives an object whose keys are namespaces
        let namespaces = Object.keys(context.types[t]);
        namespaces.forEach((ns)=>{

            let typesArray = context.types[t][ns];
            for (let i=0; i<typesArray.length;i++){
                let resource = typesArray[i];
                if (data[resource.fqn]){
                    typesArray[i].tags= data[resource.fqn].tags;
                    tagMerge(typesArray[i],data[resource.fqn].tags);
                }

                // if there are decorators referring to a markdown file, load that in as well
                let decorators = typesArray[i].decorators;
                if (decorators.docs){
                    for (let d = 0; d< decorators.docs.length;d++){
                        let name = path.resolve(options.docsPrefix,decorators.docs[d]);
                        let info = fs.readFileSync(name,'utf8');
                        typesArray[i].decorators[decorators.docs[d]] = info;
                    }
                }
            }
        });
    });

    return context;

}

module.exports = classdeclarations;