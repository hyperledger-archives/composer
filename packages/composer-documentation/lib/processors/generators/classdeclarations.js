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

function tagMerge(resource,tags){

    for (let t=0; t<tags.length; t++){
        if (tags[t].title === 'param'){
            let desc = tags[t].description;
            let name = tags[t].name;
            resource.properties[name].description = desc;
        }
    }

}


/**
 * Takes care of the class declarations
 *
 * @param {Object} context add the details to this for the template
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

    ['asset','concept','transaction','enum','participant'].forEach((t)=>{
        // need to added the parsed comments to the existing structure
        for (let i=0; i<context.types[t].length;i++){
            let resource = context.types[t][i];
            if (data[resource.fqn]){
                context.types[t][i].tags= data[resource.fqn].tags;
                tagMerge(context.types[t][i],data[resource.fqn].tags);
            }

            // if there are decorators referring to a markdown file, load that in as well
            let decorators = context.types[t][i].decorators;
            if (decorators.docs){
                for (let d = 0; d< decorators.docs.length;d++){
                    let name = path.resolve(options.docsPrefix,decorators.docs[d]);
                    let info = fs.readFileSync(name,'utf8');
                    context.types[t][i].decorators[decorators.docs[d]] = info;
                }
            }
        }
    });

    return context;

}

module.exports = classdeclarations;