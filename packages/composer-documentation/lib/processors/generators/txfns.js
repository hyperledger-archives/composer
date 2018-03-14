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
const js2flowchart = require('js2flowchart');
const path = require('path');
const fs = require('fs');

/**
 * Txfns processing
 */
function txfns(context) {

    // generate the flowcharts
    context.scripts.files.forEach((file) => {
        file.functions.forEach((fn) => {
            let name = fn.name;
            let code = fn.text;
            let svg = js2flowchart.convertCodeToSvg(code);
            console.log(context._args);
            fs.writeFileSync(path.resolve(context._args.outdir, name + '.svg'), svg, 'utf-8');
        });
    });


    return context;
}

module.exports = txfns;