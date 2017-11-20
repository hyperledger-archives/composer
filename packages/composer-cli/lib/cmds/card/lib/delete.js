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
const chalk = require('chalk');
/**
 * Composer "card delete" command
 * @private
 */
class Delete {
  /**
    * Command implementation.
    * @param {Object} args argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(args) {
        return cmdUtil.createAdminConnection().deleteCard(args.name).then((cardExisted) => {
            if (cardExisted) {
                cmdUtil.log(chalk.bold.blue('Deleted Business Network Card: ') + args.name);
            } else {
                cmdUtil.log(chalk.bold.blue('Card not found: ') + args.name);
            }
        });
    }

}

module.exports = Delete;
