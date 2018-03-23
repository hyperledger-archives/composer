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

const Service = require('./service');

/**
 * Base class representing the logging service provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class LoggingService extends Service {

    /** Get the config (if possible) for the standard winston logger
     * @abstract
     */
    getLoggerCfg() {
        throw new Error('abstract function called');
    }

    /**
     * @abstract
     */
    setLoggerCfg() {
        throw new Error('abstract function called');
    }

    /**
     * @abstract
     */
    initLogging(){
        throw new Error('abstract function called');
    }

    /**
     * @abstract
     */
    callback(){
        throw new Error('abstract function called');
    }

    /**
     * @abstract
     *
     */
    mapCfg(){
        throw new Error('abstract function called');
    }
}

module.exports = LoggingService;
