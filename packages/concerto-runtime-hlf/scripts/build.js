/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const browserify = require('browserify');
const fs = require('fs-extra');
const path = require('path');

const sourceFile = require.resolve('@ibm/ibm-concerto-runtime');
const sourcePolyfill = path.resolve(__dirname, '..', 'node_modules', 'babel-polyfill', 'dist', 'polyfill.min.js');
const targetFile = path.resolve(__dirname, '..', 'concerto.js.go');

fs.ensureFileSync(targetFile);
const wstream = fs.createWriteStream(targetFile);
wstream.setDefaultEncoding('utf8');
wstream.write('package main\n\nconst babelPolyfillJavaScript = `\n');

return Promise.resolve()
.then(() => {
    return new Promise((resolve, reject) => {
        const rstream = fs.createReadStream(sourcePolyfill);
        rstream.on('end', resolve);
        rstream.on('error', reject);
        rstream.pipe(wstream, { end: false });
    });
})
.then(() => {
    return new Promise((resolve, reject) => {
        wstream.write('`\n\nconst concertoJavaScript = `\n');
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
                    to: `/(\s)|(bound)./g`
                }
            ], global: true })
            // The ignore is to workaround these issues:
            //   https://github.com/Starcounter-Jack/JSON-Patch/issues/140
            .transform('babelify', { presets: [ 'es2015' ], global: true, ignore: /fast-json-patch/ })
            // Can't get uglifyify to include source maps, so disabling for now.
            // .transform('uglifyify', { global: true })
            .bundle();
        rstream.setEncoding('utf8');
        rstream.on('end', () => {
            wstream.write('`\n');
            wstream.end();
            resolve();
        });
        rstream.on('error', reject);
        rstream.on('data', (string) => {
            wstream.write(string.replace(/`/g, '`+"`"+`'));
        });
    });
})
.catch((err) => {
    console.error(err);
    process.exit(1);
});
