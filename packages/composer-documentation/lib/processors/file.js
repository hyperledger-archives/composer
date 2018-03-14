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

const vfs = require('vinyl-fs');
const path = require('path');
const winston = require('winston');
const LOG = winston.loggers.get('opus');

let copy = async function(context,meta){

    // use the vinyl fs to move the names
    await new Promise( (resolve)=>{
        LOG.info(`Copying from ${meta.srcdir} to ${meta.destdir}`);
        vfs.src([meta.srcdir])
            .pipe(vfs.dest(path.resolve(meta.destdir)))
            .on('finish',resolve);
    });


};

module.exports = function(processors){
    processors.copy = { post: copy };
};