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

const fs = require('fs-extra');
const path = require('path');

let masterData = {};

// Loop through all the files in the input directory
processDirectory('./jsondata/');

/**
 * Processes all the Javascript files within a directory.
 *
 * @param {string} path - the path to process
 * @private
 */
function processDirectory(path) {
    let items = [];
    fs.walk(path)
        .on('readable', function (item) {
            while ((item = this.read())) {
                if (item.stats.isFile()) {
                    items.push(item.path);
                }
            }
        })
        .on('end', () => {
            items.sort();
            items.forEach((item) => {
                processFile(item);
            });
            augment();
           
            fs.writeFileSync('allData.json',JSON.stringify(masterData),'utf8');
            write();
        });
}

function augment(){
    Object.keys(masterData).forEach((module)=>{
        Object.keys(masterData[module]).forEach((c)=>{
            // if the class does have something it extends, we need to add the methods
            // otherwise, move on. 
            let thisClass = masterData[module][c];
            if (thisClass.extends){               
                addSuperClassMethods(thisClass);                
            }
        });
    });
}
function write(){
    Object.keys(masterData).forEach((module)=>{
        Object.keys(masterData[module]).forEach((c)=>{
            // if the class does have something it extends, we need to add the methods
            // otherwise, move on. 
            let thisClass = masterData[module][c];
            let filename = path.resolve('./jsondata/',module+'-'+(thisClass.name.toLowerCase())+'.json')
            fs.writeFileSync(filename,JSON.stringify(thisClass),'utf8');
        });
    });
}
// Simple function to add in the super class methods
function addSuperClassMethods(thisClass){
    let superType = thisClass.extends;
    if (!thisClass.superMethods){
        thisClass.superMethods=[];
    }
    while (superType){
        // asumption that super types are in the same module
        let superTypeDetails =  masterData[thisClass.module][superType];
        if (!superTypeDetails) {superType=null; continue;}
        let superMethods = superTypeDetails.methods;
        // for each method, check if it has been overridden locally and if it hasn't then 
        // add it
        superMethods.forEach((m)=>{
            let foundMethod= thisClass.methods.find( (localMethod)=>{ return localMethod.name === m.name;});
            if (!foundMethod){
                thisClass.superMethods.push({"fromClass": superType, "method" :m});
            }
        })

        // finally get the superType of the superType
        superType = superTypeDetails.extends;
    }
}

/**
 * Processes a single Javascript file (.js extension)
 *
 * @param {string} file - the file to process
 * @private
 */
function processFile(file, fileProcessor) {
    let filePath = path.parse(file);
    if (filePath.ext === '.json') {
        console.log('%s is a file.', file);
        let fileContents = fs.readFileSync(file, 'utf8');
        let data = JSON.parse(fileContents);
        let m = data.module;

        if (!masterData.hasOwnProperty(m)){
            masterData[m] = {};
        }
        masterData[m][data.name]=(data);
    }
}
