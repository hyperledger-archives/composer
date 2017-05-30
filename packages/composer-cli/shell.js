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

// not using the config file module as this could be run anwhere so suppress warning
process.env.SUPPRESS_NO_CONFIG_WARNING = true;

let _ = require('lodash');
let figlet = require('figlet');
const readline = require('readline');
const chalk = require('chalk');

let enrollId;
let enrollSecret;
let rl;

/**
 * Get the yargs instance
 * @return {yargs} instance of the yargs to process
*/
function getYargsInstance(){

    return require('yargs/yargs')(process.argv.slice(2)).reset()
    .commandDir('./lib/cmds')
    .commandDir('./lib/shellcmds')
    .help('help','desc')
    .example('composer archive create --inputDir .\ncomposer identity issue\ncomposer network deploy\ncomposer participant add\ncomposer transaction submit')
    // .demand(1)
    .wrap(null)
    .strict()
    .epilogue('For more information on Hyperledger Composer: https://hyperledger.github.io/composer/')
    .alias('v', 'version')
    .version(function() {
        return getInfo('composer-cli')+'\n'+
          getInfo('composer-admin')+'\n'+getInfo('composer-client')+'\n'+
          getInfo('composer-common')+'\n'+getInfo('composer-runtime-hlf')+
          '\n'+getInfo('composer-connector-hlf')+'\n';
    })
    .describe('v', 'show version information')
    .command('exit', 'exit', function(argv){
        rl.close();
    })
    .command( 'enroll',
        'cache locally the enrollID and enrollSecret',
        { enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
            enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' }},
    function (argv) {
        enrollId = argv.enrollId;
        enrollSecret = argv.enrollSecret;
        console.log(chalk.green('Cached the enrollId and secret for this session ONLY.'));
        rl.setPrompt(chalk.yellow('composer'+' '+enrollId+' > '));
    }
  )
    // .command({
    //     command: 'configure',
    //     aliases: ['config', 'cfg'],
    //     desc: 'Set a config variable',
    //     builder: {enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    //         enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' }},
    //     handler: (argv) => {
    //         console.log(`setting ${argv.key} to ${argv.value}`);
    //     }
    // })
    .exitProcess(false)
    ;
}

/**
 * Run the shell, with the resolve/reject functions from the promise being passed in.
 * @param {Fn} resolve called to resolve the promise
 * @param {Fn} reject called to resolve the promise
*/
function runShell(resolve,reject) {
    // Produce the header
    init();
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });

    // set the prompt
    rl.setPrompt(chalk.yellow('composer > '));
    rl.prompt();

    // when a line has been entered by the user
    rl.on('line', function(line) {
        if (!line.trim()) {
            // case where they have typed spaces for some reason
            rl.prompt();
            return;
        } else if (line === 'conga'){
            console.log(conga());
            rl.prompt();
            return;
        } else {
            try {
                // get the yargs instance and add on the enrollment info if not already
                let y = getYargsInstance();

                // remove any duplicate or more spaces... YARGS can't handle this using the parse method
                line = line.replace(/\s\s+/g, ' ');
                console.log(chalk.blue.italic('submitted :'+line+':'));

                let ctx = {};
                if (!(enrollId === null || enrollId === undefined)){
                    ctx.enrollId = enrollId;
                    ctx.enrollSecret = enrollSecret;
                }

                let results = y.parse(line,ctx,function (err, argv, output) {
                    if (output){
                        console.log(output);
                    }
                });

                // get the promise from the command handler and don't put the prompt outuntil that has occurred.
                if (typeof(results.thePromise) !== 'undefined'){
                    results.thePromise.then( () => {
                        rl.prompt();
                    });
                } else {
                    rl.prompt();
                }

            } catch( error ){
                console.log(chalk.red('ERROR:') + error);
                console.log(chalk.red(error.stack));
                rl.prompt();
            }


            return;
        }
    });

    rl.on('close', function() {
        console.log(chalk.green('\nGood bye!'));
        resolve();
    });

}

/**
 * Essential initalization for the header
*/
function init(){
    // clear the screen
    process.stdout.write('\u001B[2J\u001B[0;0f');

    let banner = figlet.textSync('Hyperledger Composer', {
        font: 'Small',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    });


    let meta = ['hyperledger.github.io/composer',' | Version: ',   require('./package.json').version, '\n'].join('');

    console.log(chalk.red(banner));
    console.log(chalk.gray(meta));

    console.log('Starting directory: ' + process.cwd());
}

/**
 * [getInfo description]
 * @param  {[type]} moduleName [description]
 * @return {[type]}            [description]
 */
function getInfo(moduleName){
    let pjson = require(moduleName+'/package.json');
    return _.padEnd(pjson.name,30) + ' v'+pjson.version;
}

/**
 * @return {Promise} the shell promise
*/
function shellPromise(){

    let shellPromise = new Promise(
      function(resolve,reject){
          runShell(resolve,reject);
      }
    );

    return shellPromise;
}


/**
  @return {String} block
*/
function conga(){

    return [
        '          *         ','\n',
        '       *   *       ','\n',
        '     *       *     ','\n',
        '   *           *   ','\n',
        ' *               * ','\n',
        ' | *           * | ','\n',
        ' |   *       *   | ','\n',
        ' |     *   *     | ','\n',
        ' |   >   *    0  | ','\n',
        ' |   >>  | 0     | ','\n',
        ' *   >   |   _^  * ','\n',
        '   *     |     *   ','\n',
        '     *   |   *     ','\n',
        '       * | *       ','\n',
        '         *         ','\n'].join(' ');



}

module.exports.shell=shellPromise;
