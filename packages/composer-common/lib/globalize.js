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

const messages = require('../messages/en.json');

/**
 * Dummy globalize replacement.
 * @param {string} message The message.
 * @return {function} A function for formatting the message.
 * @private
 */
function messageFormatter(message) {
    return function (inserts) {
        let result = messages.en[message];
        for (let key in inserts) {
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), inserts[key]);
        }
        return result;
    };
}

/**
 * Dummy globalize replacement.
 * @param {string} message The message.
 * @return {function} The formatted message.
 * @private
 */
function formatMessage(message) {
    return messages.en[message];
}

/**
 * Dummy globalize replacement.
 * @param {string} locale The locale.
 * @return {Object} A mock globalize instance.
 * @private
 */
function Globalize(locale) {
    return {
        messageFormatter: messageFormatter,
        formatMessage: formatMessage
    };
}

Globalize.messageFormatter = messageFormatter;
Globalize.formatMessage = formatMessage;

module.exports = Globalize;
