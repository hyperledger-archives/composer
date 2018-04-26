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
    generate(program, file, includes = [], classes = [], functions = []) {
        let classData = classes[0];
        if (classData){
            // merge the methods and the functions
            classData.methods = classData.methods || [];

            classData.methods = classData.methods.concat(functions);

            let json = this._process(classData);
            if (json.module) {
                let f = path.resolve(program.outputDir, json.module+'-'+path.parse(file).name+'.json');
                fs.writeFileSync(f,JSON.stringify(json));
            }
        }
    }

    /**
     * This takes a set of data that represents a class, or something that is effectively a class
     * and produces a formed up set of JSON data reperesenting this.
     * This can then be processed for documentation of other puposes.
     * @return {Object} JSON data
     * @param {Object} data to process
     */
    _process(data)  {
        data.commentData = data.commentData || {};
        data.commentData.description = data.commentData.description || '';
        data.commentData.tags = data.commentData.tags || [];



        data.description = data.commentData.description.replace(/\n\s*\n/g, '~~~~').replace(/\n/g, ' ').split('~~~~');
        data.seeAlso=[];
        data.visibility='public';
        data.commentData.tags.forEach((e)=>{
            if (e.title==='extends'){
                data.extends=e.name;
            } else if (e.title === 'see'){
                data.seeAlso.push(e.description);
            } else if (e.title === 'memberof'){
                data.module=e.description.substr(e.description.indexOf('-')+1);
            } else if (e.title === 'private'){
                data.visibility ='private';
            }  else if (e.title === 'protected'){
                data.visibility='protected';
            } else if (e.title === 'summary'){
                data.summary = e.description;
            }
        });

        if (!data.summary){
            let s =  data.description.join(' ');
            let i = s.indexOf('.');
            if (i>0) {
                data.summary = s.substring(0,i);
            }
        }
        delete data.tags;



        data.methods = data.methods.filter((e)=>{return e.visibility==='+';});
        data.methods
            .forEach((e)=>{
                e.description = e.commentData.description.replace(/\n\s*\n/g, '~~~~').replace(/\n/g, ' ').split('~~~~');
                e.parameters = [];
                e.suboptions = [];
                e.seeAlso = [];
                e.commentData.tags.forEach( (p)=>{
                    if (p.title==='param'){
                        let oneParam = {};
                        oneParam.description=p.description.replace(/\n/g, ' ');
                        if (p.type.type==='OptionalType'){
                            oneParam.type=p.type.expression.name;
                            oneParam.name=p.name;
                            oneParam.optional=true;
                        } else if (p.type.type==='UnionType') {
                            oneParam.name=p.name;
                            oneParam.type= p.type.elements.map((e)=>{
                                if (e.expression && e.expression.name === 'Array'){
                                    return e.applications[0].name+'[]';
                                } else {
                                    return e.name;
                                }
                            }).join('; ');
                            oneParam.optional=false;
                        } else {
                            oneParam.type=p.type.name;
                            oneParam.name=p.name;
                            oneParam.optional=false;
                        }
                        if (oneParam.name && oneParam.name.indexOf('.')>0){
                            e.suboptions.push(oneParam);
                        }else {
                            e.parameters.push(oneParam);
                        }
                    } else if (p.title.startsWith('return')) {
                        if (p.type.name){
                            e.return = {
                                description : p.description.replace(/\n\s*\n/g, '~~~~').replace(/\n/g, ' ').split('~~~~'),
                                type : p.type.name
                            };
                        } else {

                            if (p.type.expression && p.type.expression.name === 'Array'){

                                e.return = {
                                    description : p.description.replace(/\n\s*\n/g, '~~~~').replace(/\n/g, ' ').split('~~~~'),
                                    type : p.type.applications[0].name+'[]'
                                };
                            }
                        }
                    } else if (p.title === 'see'){
                        e.seeAlso.push(p.description);
                    } else if (p.title === 'summary'){
                        e.summary = p.description;
                    }
                });
                if (!e.summary){
                    let s =  e.description.join(' ');
                    let i = s.indexOf('.');
                    if (i>0) {
                        e.summary = s.substring(0,i);
                    }
                }
            });
        return data;
    }


}


module.exports = JSONGenerator;
