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
const map = require('map-stream');
const through = require('through2').obj;

let logname = function(file,cb){
    LOG.info(`Input glob is ${file.path}`);
    cb(null,file);
};

let copy = async function(context,meta){

    // use the vinyl fs to move the names
    await new Promise( (resolve)=>{
        LOG.info(`Copying from ${meta.srcdir} to ${meta.destdir}`);
        vfs.src([meta.srcdir]).pipe(map(logname))
            .pipe(vfs.dest(path.resolve(meta.destdir)))
            .on('finish',resolve)
            .on('close',resolve);
    });


};

let split = async function(context,meta){

    await new Promise( (resolve)=>{
        LOG.info(`Spliting files from ${path.resolve(meta.inputdir)} to ${meta.outputdir} based on regexp ${meta.regexp}`);
        let srcPath = [path.join(meta.inputdir,meta.pattern)];
        let regexp = new RegExp(meta.regexp);
        vfs.src(srcPath).pipe(map(logname))
            .pipe(through(function (file, enc, cb) {
                let c = file.contents.toString().trim();
                let f = path.parse(file.path);

                let splits = c.split(regexp);
                splits.shift();
                if (splits.length>1){
                    for (let i=0; i<splits.length;i+=2){
                        let file1 = file.clone();
                        file1.contents = new Buffer(splits[i+1]);
                        file1.path = path.join(f.dir, splits[i] + f.ext);

                        this.push(file1);

                    }
                } else {
                    this.push(file);
                }

                cb();
            }))
            .pipe(vfs.dest(path.resolve(meta.outputdir)))
            .on('finish',resolve)
            .on('close',resolve);
    });

};

module.exports = function(processors){
    processors.copy = { post: copy };
    processors.split = { post: split };
};