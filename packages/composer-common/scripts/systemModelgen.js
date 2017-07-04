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

const targetFile = path.resolve(__dirname, '..', 'lib','systemModel.js');
const templatePath = path.resolve(__dirname, '..', 'lib','_template');
const modelFile = path.resolve(__dirname, '..', 'lib','system.cto');

let env = nunjucks.configure(templatePath,{autoescape:false});

// get the template file
let model = fs.readFileSync(modelFile,  { encoding: 'utf8' });
// let template = fs.readFileSync(templateFile,  { encoding: 'utf8' });

let jsModel = env.render('systemModel.njk',{ systemmodel: model});

fs.writeFileSync(targetFile, jsModel, { encoding: 'utf8' });
