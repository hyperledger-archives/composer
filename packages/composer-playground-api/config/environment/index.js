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

// All configurations will extend these options
// ============================================
const all = {
    // Server port
    port : process.env.PORT || 15699,

    clientSecret : process.env.CLIENT_SECRET,

    clientId : process.env.CLIENT_ID,

    githubAccessTokenUrl : process.env.GITHUB_ACCESS_TOKEN_URL || 'https://github.com/login/oauth/access_token',
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = all;
