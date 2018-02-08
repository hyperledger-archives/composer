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

import * as path from 'path';
import { Promise } from 'bluebird';
import { exec } from 'child_process';
const pExec = Promise.promisify(exec);

export class CliHelper {
    static importCard(filePath: string, cardName: string) {
        return pExec(`composer card import --file ${filePath} --name ${cardName}`);
    }

    static pingCard(cardName: string) {
        return pExec(`composer network ping --card ${cardName}`);
    }
}
