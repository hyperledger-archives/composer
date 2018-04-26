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

import { Constants } from '../constants';
import { BusinessNetworkDefinition }  from 'composer-admin';
import fs = require('fs');

/** Class to help with Composer resources */
export class ComposerUtils {

    /**
     * Build a BNA file from a resource directory
     * @param sourceDirectory {string} path to the resources for the business network
     * @param outFile the output BNA file
     */
    static buildArchive(sourceDirectory, outFile) {
        return BusinessNetworkDefinition.fromDirectory(sourceDirectory).then((defn) => {
            // need to write this out to the required file now.
            return defn.toArchive()
                .then((archive) => {
                    // write the buffer to a file
                    fs.writeFileSync(outFile, archive);
                    return;
                });
        });
    }
}
