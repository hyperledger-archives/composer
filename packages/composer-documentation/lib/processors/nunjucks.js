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

const path = require('path');
const nunjucks = require('nunjucks');
const vfs = require('vinyl-fs');
const map = require('map-stream');



let multipleTemplates = async function(context,meta){

    let templatePath = path.join(context.root.templateroot,meta.inputdir);
    // Note autoescape false - otherwise the --> in the cto file is replaced with --&gt;
    let env = nunjucks.configure(templatePath, { autoescape: false });
    let srcPath = [path.join(templatePath,meta.pattern)];

    let produce = (file,cb) =>{
        let renderedMarkdown = env.render(file.path, context);
        file.contents = Buffer.from(renderedMarkdown);
        file.extname=meta.outputextension;
        cb(null, file);
    };

    await new Promise((resolve) => {
        vfs.src(srcPath)
            .pipe(map(produce))
            .pipe(vfs.dest(path.resolve(meta.outputdir)))
            .on('finish',resolve);
    });


};

let singleTemplate = async function(context,meta){

    let templatePath = path.join(context.root.templateroot,meta.inputdir);
    context.callindex = 0;
    // Note autoescape false - otherwise the --> in the cto file is replaced with --&gt;
    let env = nunjucks.configure(templatePath, { autoescape: false });

    let produce = (file,cb) =>{
        context.body = file.contents.toString();
        let orderSeparator = file.basename.indexOf('_');
        context.callindex = parseInt(file.basename.substring(0,orderSeparator));
        context.basename = file.basename.substring(orderSeparator+1,file.basename.indexOf('.'));
        let renderedMarkdown = env.render(meta.template, context);
        file.contents = Buffer.from(renderedMarkdown);
        file.extname=meta.extension;
        cb(null, file);
    };
    context[meta.streamId].pipeElements.push(produce);
};

module.exports = function(processors){
    processors.njk_multi = { post: multipleTemplates };
    processors.njk_single = { post: singleTemplate };
};