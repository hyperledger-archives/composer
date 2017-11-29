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

class Stub {

    getArgs() {
    }

    getStringArgs() {
    }

    getFunctionAndParameters() {
    }

    getTxID() {
    }

    getCreator() {
    }

    getTransient() {
    }

    getSignedProposal() {
    }

    getTxTimestamp() {
    }

    getBinding() {
    }

    getState(key) {
    }

    putState(key, value) {
    }

    deleteState(key) {
    }

    getStateByRange(startKey, endKey) {
    }

    getQueryResult(query) {
    }

    getHistoryForKey(key) {
    }

    invokeChaincode(chaincodeName, args, channel) {
    }

    setEvent(name, payload) {
    }

    createCompositeKey(objectType, attributes) {
    }

    splitCompositeKey(compositeKey) {
    }

    getStateByPartialCompositeKey(objectType, attributes) {
    }
}

module.exports = Stub;
