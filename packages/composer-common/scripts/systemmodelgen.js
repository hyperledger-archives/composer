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
const nunjucks=require('nunjucks');

const targetFile = path.resolve(__dirname, '..', 'lib','systemmodel.js');
const templatePath = path.resolve(__dirname, '..', 'lib','_template');
const modelDirectory = path.resolve(__dirname, '..', 'lib','system');
const modelFiles = fs.readdirSync(modelDirectory);

// nunjucks is already used in other parts of the codebase
// that is the primary reason for choosing it!
// Note autoescape false - otherwise the --> in the cto file is replaced with --&gt;
let env = nunjucks.configure(templatePath,{autoescape:false});

// get the template file
const models = modelFiles.map((modelFile) => {
    const contents = fs.readFileSync(path.resolve(modelDirectory, modelFile), 'utf8');
    let ns = modelFile.substr(0,modelFile.indexOf('.cto'));
    return {
        namespace: ns,
        fileName: modelFile,
        contents: contents
    };
});

// render the model
let jsModel = env.render('systemmodel.njk',{ systemmodels: models});

// and write out the file
fs.writeFileSync(targetFile, jsModel, { encoding: 'utf8' });
