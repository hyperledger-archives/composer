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

/**
 * Composer specific utility methods.
 */
class Composer {

  /**
   * Restrict the remote methods on the specified model class to a clean subset.
   * @param {*} model The model class.
   */
  static restrictModelMethods(model) {
    // We now want to filter out methods that we haven't implemented or don't want.
    // We use a whitelist of method names to do this.
    let whitelist;
    if (model.settings.composer.abstract) {
      whitelist = [];
    } else if (model.settings.composer.type === 'concept') {
      whitelist = [];
    } else if (model.settings.composer.type === 'transaction') {
      whitelist = ['create', 'find', 'findById', 'exists'];
    } else {
      whitelist = ['create', 'deleteById', 'replaceById',
        'find', 'findById', 'exists'];
    }
    model.sharedClass.methods().forEach((method) => {
      const name = (method.isStatic ? '' : 'prototype.') + method.name;
      if (whitelist.indexOf(name) === -1) {
        model.disableRemoteMethodByName(name);
      } else if (name === 'exists') {
        // We want to remove the /:id/exists method.
        method.http = [{verb: 'head', path: '/:id'}];
      } else if (name === 'replaceById') {
        // We want to remove the /:id/replace method.
        method.http = [{verb: 'put', path: '/:id'}];
      }
    });
  }

}

module.exports = Composer;
