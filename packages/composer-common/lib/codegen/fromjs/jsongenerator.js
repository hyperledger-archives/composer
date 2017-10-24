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
const path = require('path');
// const Writer = require('../writer');

/**
 * @private
 * @class
 * @memberof module:composer-common
 */
class JSONGenerator {

    /**
     * @param {Object} program - the program arguments
     * @param {Object} file - the file instance being processed
     * @param {Object[]} includes - the includes (require statements) within the file
     * @param {Object[]} classes - the classes within the file
     * @param {Object[]} functions - the functions within the file
     */
    generate(program, file, includes, classes, functions) {
        let data  = classes[0];
        if (data){
            data.description = data.commentData.description.split('\n');
            data.seeAlso=[];
            data.visibility='public';
            data.commentData.tags.forEach((e)=>{
                if (e.title==='extends'){
                    data.extends=e.name;
                } else if (e.title === 'see'){
                    //  "See [Registry]{@link module:composer-client.Registry}"
                    let s1 = e.description.substring(0,e.description.indexOf('{'));
                    let a = e.description.indexOf('}');
                    let b = e.description.lastIndexOf('.')+1;
                    data.seeAlso.push(s1+'('+e.description.substring(a,b).toLowerCase()+')');
                } else if (e.title === 'memberof'){

                    data.module=e.description.substr(e.description.indexOf('-')+1);

                } else if (e.title === 'private'){
                    data.visibility ='private';
                }  else if (e.title === 'protected'){
                    data.visibility='protected';
                }
            });
            delete data.tags;



            let listMethods = data.methods;
            listMethods
            .forEach((e)=>{
                e.description = e.commentData.description.split('\n');
                e.parameters = [];
                e.commentData.tags.forEach( (p)=>{
                    if (p.title==='param'){
                        let oneParam = {};
                        oneParam.description=p.description;
                        if (p.type.type==='OptionalType'){
                            oneParam.type=p.type.expression.name;
                            oneParam.name=p.name;
                            oneParam.optional=true;
                        }    else {
                            oneParam.type=p.type.name;
                            oneParam.name=p.name;
                            oneParam.optional=true;
                        }
                        e.parameters.push(oneParam);
                    } else if (p.title.startsWith('return')) {
                        e.return={description:p.description.split('\n'),
                            type : p.type.name};
                    }
                });
            });

            let f = path.resolve(program.outputDir, path.parse(file).name+'.json');
            fs.writeFileSync(f,JSON.stringify(data));
        }
        // console.log(JSON.stringify(data));
    }
}


module.exports = JSONGenerator;
