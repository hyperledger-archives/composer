#!/usr/bin/env node
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

const validator = require('../lib/profilevalidator.js');
const chalk = require('chalk');

if(process.argv.length!==3) {
    console.log(chalk.red.bold('\nUsage: ') + chalk.red('composer-validate-profile <connection profile filename>\n'));
    process.exit(1);
} else {
    validator.validateProfile(process.argv[2]);
}

