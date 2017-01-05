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
        if (Array.isArray(inserts)) {
            for (let i = 0; i < inserts.length; i++) {
                result = result.replace(new RegExp(`{${i}}`), inserts[i]);
            }
        } else {
            for (let key in inserts) {
                result = result.replace(new RegExp(`{${key}}`, 'g'), inserts[key]);
            }
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
