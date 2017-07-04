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
const zlib = require('zlib');

const sourceFile = require.resolve('composer-runtime');
const sourcePolyfill = require.resolve('babel-polyfill/dist/polyfill.min.js');
const targetFile = path.resolve(__dirname, '..', 'composer.js.go');
const targetFile2 = path.resolve(__dirname, '..', 'composer.js.map');
const targetFile3 = path.resolve(__dirname, '..', 'composer.js');
const targetFile4 = path.resolve(__dirname, '..', 'composer.min.js');

fs.ensureFileSync(targetFile);
fs.ensureFileSync(targetFile2);
fs.ensureFileSync(targetFile3);
fs.ensureFileSync(targetFile4);
const wstream = fs.createWriteStream(targetFile);
wstream.setDefaultEncoding('utf8');
wstream.write(
`package main

import (
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"io/ioutil"
	"strings"
)

func parseEmbeddedData(data string) string {
	data = strings.TrimSpace(data)
	gzipped, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		panic(err)
	}
	reader := bytes.NewReader(gzipped)
	gzip, err := gzip.NewReader(reader)
	if err != nil {
		panic(err)
	}
	result, err := ioutil.ReadAll(gzip)
	if err != nil {
		panic(err)
	}
	return string(result)
}`);
const wstream3 = fs.createWriteStream(targetFile3);
wstream3.setDefaultEncoding('utf8');
const wstream4 = fs.createWriteStream(targetFile4);
wstream4.setDefaultEncoding('utf8');

const execSuffix = /^win/.test(process.platform) ? '.cmd' : '';

return Promise.resolve()
.then(() => {
    return new Promise((resolve, reject) => {
        wstream.write('\n\nconst babelPolyfillJavaScriptSource = "');
        const rstream = fs.createReadStream(sourcePolyfill);
        const gzip = zlib.createGzip();
        const cstream = rstream.pipe(gzip);
        cstream.setEncoding('base64');
        cstream.on('end', () => {
            wstream.write('"\n\nvar babelPolyfillJavaScript = parseEmbeddedData(babelPolyfillJavaScriptSource)\n');
            resolve();
        });
        cstream.on('error', reject);
        cstream.on('data', (data) => {
            wstream.write(data);
        });
    });
})
.then(() => {
    return new Promise((resolve, reject) => {
        const rstream = browserify(sourceFile, { standalone: 'composer', debug: true })
            // The ignore is to workaround these issues:
            //   https://github.com/Starcounter-Jack/JSON-Patch/issues/140
            .transform('babelify', { presets: [ 'latest' ], global: true, ignore: /fast-json-patch/ })
            .bundle();
        const exorcist = child_process.spawn(`exorcist${execSuffix}`, [targetFile2]);
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
        const uglifyjs = child_process.spawn(`uglifyjs${execSuffix}`, ['-', '--in-source-map', targetFile2, '--source-map-inline']);
        rstream.pipe(uglifyjs.stdin);
        uglifyjs.stderr.pipe(process.stderr);
        uglifyjs.stdout.pipe(wstream4);
        uglifyjs.stdout.on('end', resolve);
    });
})
.then(() => {
    return new Promise((resolve, reject) => {
        wstream.write('\nconst composerJavaScriptSource = "');
        const rstream = fs.createReadStream(targetFile4);
        const gzip = zlib.createGzip();
        const cstream = rstream.pipe(gzip);
        cstream.setEncoding('base64');
        cstream.on('end', () => {
            wstream.write('"\n\nvar composerJavaScript = parseEmbeddedData(composerJavaScriptSource)\n');
            wstream.end();
            resolve();
        });
        cstream.on('error', reject);
        cstream.on('data', (data) => {
            wstream.write(data);
        });
    });
})
.then(() => {
    fs.unlinkSync(targetFile2)
    fs.unlinkSync(targetFile3)
    fs.unlinkSync(targetFile4)
})
.catch((err) => {
    console.error(err);
    process.exit(1);
});
