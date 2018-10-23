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

const Globalize = require('composer-common').Globalize;
const HLFSecurityContext = require('./hlfsecuritycontext');
const SecurityException = require('composer-common').SecurityException;
const Util = require('composer-common').Util;

/**
 * Internal Utility Class
 * @private
 */
class HLFUtil {

    /**
     * Internal method to check the security context
     * @param {SecurityContext} securityContext - The user's security context
     * @throws {SecurityException} if the user context is invalid
     */
    static securityCheck(securityContext) {
        if (Util.isNull(securityContext)) {
            throw new SecurityException(Globalize.formatMessage('util-securitycheck-novalidcontext'));
        } else if (!(securityContext instanceof HLFSecurityContext)) {
            throw new SecurityException(Globalize.formatMessage('util-securitycheck-novalidcontext'));
        }
    }

    /**
     * Check the connectivity status of an event hub
     * @param {ChannelEventHub} eventHub the channel event hub to check connectivity status for
     * @returns {boolean} true if appears to be connected ok
     */
    static eventHubConnected(eventHub) {
        const connectionState = eventHub.checkConnection();
        // An eventHub can be connected, but in 1 of 3 states: IDLE, CONNECTING or READY.
        // if it's IDLE or CONNECTING then the channel still usable, it's just either freed resources (IDLE) internally
        // or in a state of re-establishing the connection (CONNECTING). But because the node sdk in _checkConnection
        // checks only for the READY state and disconnects it and throws an error otherwise, and _checkConnection is used
        // for the registrations, we can only check for READY. The default for IDLE_TIMEOUT for GRPC is as far as I know
        // for now, INT_MAX so connnections should never go into IDLE or CONNECTING state.
        return eventHub.isconnected() && connectionState === 'READY';
    }

}

module.exports = HLFUtil;
