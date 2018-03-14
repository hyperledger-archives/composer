
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
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const LOG = winston.loggers.get('opus');


let process = async function(context,options){
    let file = path.resolve(options.filename);


    LOG.info(`Reading JSON file from ${file}`);

    context.data = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(context);
};


module.exports = function(processors){
    processors.json = { post : process };
};