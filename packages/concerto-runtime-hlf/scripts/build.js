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

const browserify = require('browserify');
const child_process = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const sourceFile = require.resolve('@ibm/concerto-runtime');
const sourcePolyfill = require.resolve('babel-polyfill/dist/polyfill.min.js');
const targetFile = path.resolve(__dirname, '..', 'concerto.js.go');
const targetFile2 = path.resolve(__dirname, '..', 'concerto.js.map');
const targetFile3 = path.resolve(__dirname, '..', 'concerto.js');
const targetFile4 = path.resolve(__dirname, '..', 'concerto.min.js');

fs.ensureFileSync(targetFile);
fs.ensureFileSync(targetFile2);
fs.ensureFileSync(targetFile3);
fs.ensureFileSync(targetFile4);
const wstream = fs.createWriteStream(targetFile);
wstream.setDefaultEncoding('utf8');
wstream.write(
`package main

import (
    b64 "encoding/base64"
    "strings"
)

func parseJavaScriptBase64(data string) string {
    data = strings.TrimSpace(data)
    result, err := b64.StdEncoding.DecodeString(data)
    if err != nil {
        panic(err)
    }
    return string(result)
}

var babelPolyfillJavaScript = parseJavaScriptBase64(\`\n`);
const wstream3 = fs.createWriteStream(targetFile3);
wstream3.setDefaultEncoding('utf8');
const wstream4 = fs.createWriteStream(targetFile4);
wstream4.setDefaultEncoding('utf8');

return Promise.resolve()
.then(() => {
    return new Promise((resolve, reject) => {
        const rstream = fs.createReadStream(sourcePolyfill);
        rstream.setEncoding('base64');
        rstream.on('end', () => {
            wstream.write('`)\n\n');
            resolve();
        });
        rstream.on('error', reject);
        rstream.on('data', (data) => {
            data.match(/.{1,132}/g).forEach((line) => {
                wstream.write(line + '\n');
            });
        });
    });
})
.then(() => {
    return new Promise((resolve, reject) => {
        const rstream = browserify(sourceFile, { standalone: 'concerto', debug: true })
            .transform('browserify-replace', { replace: [
                // These ugly hacks are due to Go and Otto only supporting Go regexes.
                // Go regexes do not support PCRE features such as lookahead.
                {
                    // This ugly hack changes a JavaScript only regex used by acorn into something safe for Go.
                    from: /\[\^\]/g,
                    to: '[^\\x{FFFF}]'
                },
                {
                    // This ugly hack changes a JavaScript only regex used by thenify into something safe for Go.
                    from: /\/\\s\|bound\(\?!\$\)\/g/g,
                    to: '/(\s)|(bound)./g'
                }
            ], global: true })
            // The ignore is to workaround these issues:
            //   https://github.com/Starcounter-Jack/JSON-Patch/issues/140
            .transform('babelify', { presets: [ 'es2015' ], global: true, ignore: /fast-json-patch/ })
            .bundle();
        const exorcist = child_process.spawn('exorcist', [targetFile2]);
        rstream.pipe(exorcist.stdin);
        exorcist.stdout.pipe(wstream3);
        exorcist.stdout.on('end', () => {
            resolve();
        });
    });
})
.then(() => {
    return new Promise((resolve, reject) => {
        const rstream = fs.createReadStream(targetFile3);
        const uglifyjs = child_process.spawn('uglifyjs', ['-', '--in-source-map', targetFile2, '--source-map-inline']);
        rstream.pipe(uglifyjs.stdin);
        uglifyjs.stderr.pipe(process.stderr);
        uglifyjs.stdout.pipe(wstream4);
        uglifyjs.stdout.on('end', resolve);
    });
})
.then(() => {
    return new Promise((resolve, reject) => {
        wstream.write('var concertoJavaScript = parseJavaScriptBase64(`\n');
        const rstream = fs.createReadStream(targetFile4);
        rstream.setEncoding('base64');
        rstream.on('end', () => {
            wstream.write('`)\n\n');
            wstream.end();
            resolve();
        });
        rstream.on('error', reject);
        rstream.on('data', (data) => {
            data.match(/.{1,132}/g).forEach((line) => {
                wstream.write(line + '\n');
            });
        });
    });
})
.catch((err) => {
    console.error(err);
    process.exit(1);
});
