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

const Admin = require('@ibm/concerto-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const fs = require('fs');
const sanitize = require('sanitize-filename');
/**
 * <p>
 * Concerto Create Archive command
 * </p>
 *
 * @private
 */
class Deploy {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from concerto command

    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        console.log('Creating Business Network Archive');
        if (!argv.inputDir){
            const path = require('path');



            console.log(process.env.NODE_PATH);
            console.log('About to do the required');
            let moduleIndexjs;
            try {
                moduleIndexjs=require.resolve(argv.moduleName);

            } catch (err){
                if (err.code==='MODULE_NOT_FOUND'){
                    console.log('Main node_module search path empty - trying cwd');
                    moduleIndexjs=require.resolve(process.cwd()+'/node_modules/'+argv.moduleName);
                }else {
                    console.log('Unable to locate the npm moodule specified');
                    throw err;
                }

            }

            argv.inputDir = path.dirname(moduleIndexjs);
            console.log('Resolving module name '+argv.moduleName);
        }else if (argv.inputDir==='.'){
            argv.inputDir = process.cwd();
        }
        console.log('Looking for package.json of Business Network Definition in '+argv.inputDir);

        return BusinessNetworkDefinition.fromDirectory(argv.inputDir).then( (result)=> {
            console.log('\nDescription:'+result.getDescription());
            console.log('Name:'+result.getName());
            console.log('Identifier:'+result.getIdentifier());


            if (!argv.archiveFile){
                argv.archiveFile = sanitize(result.getIdentifier(),{replacement:'_'})+'.bna';
            }
          // need to write this out to the required file now.
            return result.toArchive().then (
              (result) => {
                //write the buffer to a file
                  fs.writeFileSync(argv.archiveFile,result);
                  console.log('\nWritten Business Network Definition Archive file to '+argv.archiveFile);
                  return;
              }

            );

        }).catch(function(e) {
            console.log(e); // "oh, no!"
        });

    }
}

module.exports = Deploy;
