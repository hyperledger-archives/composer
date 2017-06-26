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

const ModelManager = require('../../lib/modelmanager');
const Typed = require('../../lib/model/typed');

require('chai').should();

describe('Typed', () => {

    let modelManager;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme.base
        abstract asset BaseAsset {
        }
        abstract asset BaseAsset2 extends BaseAsset {
        }`);
        modelManager.addModelFile(`
        namespace org.acme.ext
        import org.acme.base.BaseAsset2
        asset MyAsset identified by assetId extends BaseAsset2 {
            o String assetId
        }
        asset Asset2 extends MyAsset {
        }`);
    });

    describe('#instanceOf', () => {

        it('should return true for a matching type', () => {
            let typed = new Typed(modelManager, 'org.acme.base', 'BaseAsset');
            typed.instanceOf('org.acme.base.BaseAsset').should.be.true;
        });

        it('should return true for a matching super type', () => {
            let typed = new Typed(modelManager, 'org.acme.base', 'BaseAsset2');
            typed.instanceOf('org.acme.base.BaseAsset').should.be.true;
        });

        it('should return false for a non-matching sub type', () => {
            let typed = new Typed(modelManager, 'org.acme.base', 'BaseAsset');
            typed.instanceOf('org.acme.base.BaseAsset2').should.be.false;
        });

        it('should return true for a matching nested super type', () => {
            let typed = new Typed(modelManager, 'org.acme.ext', 'Asset2');
            typed.instanceOf('org.acme.base.BaseAsset').should.be.true;
        });

    });

});
