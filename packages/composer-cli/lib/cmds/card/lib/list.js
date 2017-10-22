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

const cmdUtil = require('../../utils/cmdutils');

/**
 * Composer "card list" command
 * @private
 */
class List {
  /**
    * Command implementation.
    * @param {Object} args argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(args) {
        return cmdUtil.createAdminConnection().getAllCards().then(cardMap => {
            const cardNames = Array.from(cardMap.keys());
            if (cardNames.length > 0) {
                console.log('The following Business Network Cards are available:\n\n' +
                '    ' + cardNames.join('\n    '));
            } else {
                console.log('There are no Business Network Cards available.');
            }
        });
    }

}

module.exports = List;
