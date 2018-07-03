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
const { Typed } = require('composer-common');
const Pretty = require('prettyjson');

/**
 * <p>
 * Composer deploy command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Submit {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    */
    static async handler(argv) {
        const cardName = argv.card;
        const businessNetworkConnection = cmdUtil.createBusinessNetworkConnection();
        await businessNetworkConnection.connect(cardName);

        let data = argv.data;
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch(e) {
                throw new Error('JSON error. Have you quoted the JSON string?', e);
            }
        } else {
            throw new Error('Data must be a string');
        }

        if (!data.$class) {
            throw new Error('$class attribute not supplied');
        }

        const businessNetwork = businessNetworkConnection.getBusinessNetwork();
        const serializer = businessNetwork.getSerializer();
        const resource = serializer.fromJSON(data);

        const result = await businessNetworkConnection.submitTransaction(resource);
        if (result) {
            const prettify = (result) => {
                if (result instanceof Typed) {
                    return serializer.toJSON(result);
                }
                return result;
            };
            let prettyResult;
            if (Array.isArray(result)) {
                prettyResult = result.map(item => prettify(item));
            } else {
                prettyResult = prettify(result);
            }
            cmdUtil.log(Pretty.render(prettyResult, {
                keysColor: 'blue',
                dashColor: 'blue',
                stringColor: 'white'
            }));
        }
        cmdUtil.log('Transaction Submitted.');
    }

}

module.exports = Submit;
