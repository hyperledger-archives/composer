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
/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ModelManager, ModelFile } from 'composer-common';
import { EditorFile } from './editor-file';

import * as sinon from 'sinon';

describe('EditorFile', () => {
    let file;

    beforeEach(() => {
        file = new EditorFile('fileID', 'fileDisplayID', 'fileContent', 'fileType');
    });

    describe('EditorFile', () => {

        it('should create a file', () => {
            file['id'].should.equal('fileID');
            file['displayID'].should.equal('fileDisplayID');
            file['content'].should.equal('fileContent');
            file['type'].should.equal('fileType');
        });

        it('should return the ID of a file', () => {
            file.getId().should.equal('fileID');
        });

        it('should return the content of a file', () => {
            file.getContent().should.equal('fileContent');
        });

        it('should return the type of a file', () => {
            file.getType().should.equal('fileType');
        });

        it('should set the ID of a file', () => {
            file.setId('newFileId');
            file.getId().should.equal('newFileId');
        });

        it('should set the content of a file', () => {
            file.setContent('newFileContent');
            file.getContent().should.equal('newFileContent');
        });

        it('should set the JSON content of a file', () => {
            file.setJsonContent({content: 'newFileContent'});
            file.getContent().should.equal('{\n  "content": "newFileContent"\n}');
        });

        it('should set deisplay id', () => {
            file.setDisplayID('newDisplayId');
            file['displayID'].should.equal('newDisplayId');
        });

        it('should set the type of a file', () => {
            file.setType('newFileType');
            file.getType().should.equal('newFileType');
        });

        it('should get if model type', () => {
            file['type'] = 'model';
            file.isModel().should.equal(true);
        });

        it('should get if not model type', () => {
            file['type'] = 'bob';
            file.isModel().should.equal(false);
        });

        it('should get if script type', () => {
            file['type'] = 'script';
            file.isScript().should.equal(true);
        });

        it('should get if not script type', () => {
            file['type'] = 'bob';
            file.isScript().should.equal(false);
        });

        it('should get if acl type', () => {
            file['type'] = 'acl';
            file.isAcl().should.equal(true);
        });

        it('should get if not acl type', () => {
            file['type'] = 'bob';
            file.isAcl().should.equal(false);
        });

        it('should get if query type', () => {
            file['type'] = 'query';
            file.isQuery().should.equal(true);
        });

        it('should get if not query type', () => {
            file['type'] = 'bob';
            file.isQuery().should.equal(false);
        });

        it('should get if readme type', () => {
            file['type'] = 'readme';
            file.isReadMe().should.equal(true);
        });

        it('should get if not readme type', () => {
            file['type'] = 'bob';
            file.isReadMe().should.equal(false);
        });

        it('should get if package type', () => {
            file['type'] = 'package';
            file.isPackage().should.equal(true);
        });

        it('should get if not package type', () => {
            file['type'] = 'bob';
            file.isPackage().should.equal(false);
        });
    });

    describe('getModelNamespace', () => {

        it('should get the namespace of the model file', () => {
            file['content'] = `/**
 * Sample business network definition.
 */
namespace org.acme.sample
`;
            file.getModelNamespace().should.equal('org.acme.sample');
        });
    });

    describe('validate', () => {

        it('should validate a model file', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.ext.MyAsset2
            asset MyAsset identified by assetId {
                o String assetId
            }`;
            let modelManager = new ModelManager();
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFiles([modelFile1], [modelFile1.getName()]);
            file['type'] = 'model';
            file['content'] = model2;
            (() => file.validate(modelManager)).should.not.throw();
        });

        it('should throw error with invalid model file', () => {
            const model1 = `
            namespace org.acme.ext
            asset MyAsset2 identified by assetId {
                o String assetId
            }`;
            const model2 = `
            namespace org.acme
            import org.acme.ext.MyAsset2
            ast MyAsset identified by assetId {
                o String assetId
            }`;
            let modelManager = new ModelManager();
            let modelFile1 = new ModelFile(modelManager, model1);
            modelManager.addModelFiles([modelFile1], [modelFile1.getName()]);
            file['type'] = 'model';
            file['content'] = model2;
            (() => file.validate(modelManager)).should.throw();
        });

        it('should validate script file', () => {
            const model = `/**
 * Sample business network definition.
 */
namespace org.acme.sample
asset SampleAsset identified by assetId {
  o String assetId
  --> SampleParticipant owner
  o String value
}
participant SampleParticipant identified by participantId {
  o String participantId
  o String firstName
  o String lastName
}
transaction SampleTransaction {
  --> SampleAsset asset
  o String newValue
}
event SampleEvent {
  --> SampleAsset asset
  o String oldValue
  o String newValue
}`;
            const script = `function sampleTransaction(tx) {
                // Save the old value of the asset.
                var oldValue = tx.asset.value;
                // Update the asset with the new value.
                tx.asset.value = tx.newValue;
                // Get the asset registry for the asset.
                return getAssetRegistry('org.acme.sample.SampleAsset')
                    .then(function (assetRegistry) {
                        // Update the asset in the asset registry.
                        return assetRegistry.update(tx.asset);
                    })
                    .then(function () {
                        // Emit an event for the modified asset.
                        var event = getFactory().newEvent('org.acme.sample', 'SampleEvent');
                        event.asset = tx.asset;
                        event.oldValue = oldValue;
                        event.newValue = tx.newValue;
                        emit(event);
                    });
            }`;
            file['content'] = script;
            file['type'] = 'script';
            let modelManager = new ModelManager();
            let modelFile = new ModelFile(modelManager, model);
            modelManager.addModelFile(modelFile);
            (() => file.validate(modelManager)).should.not.throw();
        });

        it('should throw error on invalid script file', () => {
            const model = `/**
 * Sample business network definition.
 */
namespace org.acme.sample
asset SampleAsset identified by assetId {
  o String assetId
  --> SampleParticipant owner
  o String value
}
participant SampleParticipant identified by participantId {
  o String participantId
  o String firstName
  o String lastName
}
transaction SampleTransaction {
  --> SampleAsset asset
  o String newValue
}`;
            const script = `funn sampleTransaction(tx) {
                // Save the old value of the asset.
                var oldValue = tx.asset.value;
                // Update the asset with the new value.
                tx.asset.value = tx.newValue;
                // Get the asset registry for the asset.
                return getRegistry('org.acme.sample.SampleAsset')
                    .then(function (assetRegistry) {
                        // Update the asset in the asset registry.
                        return assetRegistry.update(tx.asset);
                    })
                    .then(function () {
                        // Emit an event for the modified asset.
                        var event = getFactory().newEvent('org.acme.sample', 'SampleEvent');
                        event.asset = tx.asset;
                        event.oldValue = oldValue;
                        event.newValue = tx.newValue;
                        emit(event);
                    });
            }`;
            file['content'] = script;
            file['type'] = 'script';
            let modelManager = new ModelManager();
            let modelFile = new ModelFile(modelManager, model);
            modelManager.addModelFile(modelFile);
            (() => file.validate(modelManager)).should.throw();
        });

        it('should validate a query file', () => {
            const model = `/**
 * Commodity trading network
 */
namespace org.acme.trading
asset Commodity identified by tradingSymbol {
    o String tradingSymbol
    o String description
    o String mainExchange
    o Double quantity
    --> Trader owner
}
participant Trader identified by tradeId {
    o String tradeId
    o String firstName
    o String lastName
}`;
            const query = `
query selectCommodities {
  description: "Select all commodities"
  statement:
      SELECT org.acme.trading.Commodity
}`;
            file['content'] = query;
            file['type'] = 'query';
            let modelManager = new ModelManager();
            let modelFile = new ModelFile(modelManager, model);
            modelManager.addModelFile(modelFile);
            (() => file.validate(modelManager)).should.not.throw();
        });

        it('should throw error on invalid query file', () => {
            const model = `/**
 * Commodity trading network
 */
namespace org.acme.trading
asset Commodity identified by tradingSymbol {
    o String tradingSymbol
    o String description
    o String mainExchange
    o Double quantity
    --> Trader owner
}
participant Trader identified by tradeId {
    o String tradeId
    o String firstName
    o String lastName
}`;
            const query = `
query selectCommodities {
  description: "Select all commodities"
  statement:
      SELBOBECT org.acme.trading.Commodity
}`;
            file['content'] = query;
            file['type'] = 'query';
            let modelManager = new ModelManager();
            let modelFile = new ModelFile(modelManager, model);
            modelManager.addModelFile(modelFile);
            (() => file.validate(modelManager)).should.throw();
        });

        it('should validate acl file', () => {
            const model = `/**
 * Sample business network definition.
 */
namespace org.acme.sample
asset SampleAsset identified by assetId {
  o String assetId
  --> SampleParticipant owner
  o String value
}
participant SampleParticipant identified by participantId {
  o String participantId
  o String firstName
  o String lastName
}
transaction SampleTransaction {
  --> SampleAsset asset
  o String newValue
}`;
            const acl = `rule SystemACL {
                description:  "System ACL to permit all access"
                participant: "org.hyperledger.composer.system.Participant"
                operation: ALL
                resource: "org.hyperledger.composer.system.**"
                action: ALLOW
            }`;
            file['content'] = acl;
            file['type'] = 'acl';
            let modelManager = new ModelManager();
            let modelFile = new ModelFile(modelManager, model);
            modelManager.addModelFile(modelFile);
            (() => file.validate(modelManager)).should.not.throw();
        });

        it('should throw error on invalid acl file', () => {
            const model = `/**
 * Sample business network definition.
 */
namespace org.acme.sample
asset SampleAsset identified by assetId {
  o String assetId
  --> SampleParticipant owner
  o String value
}
participant SampleParticipant identified by participantId {
  o String participantId
  o String firstName
  o String lastName
}
transaction SampleTransaction {
  --> SampleAsset asset
  o String newValue
}`;
            const acl = `rule SystemACL {
                description:  "System ACL to permit all access"
                participant: "org.hyperledger.composer.system.Participant"
                operation: ALL
                resource: "org.hyperledger.composer.system.**"
                action: BOB
            }`;

            file['content'] = acl;
            file['type'] = 'acl';
            let modelManager = new ModelManager();
            let modelFile = new ModelFile(modelManager, model);
            modelManager.addModelFile(modelFile);
            (() => file.validate(modelManager)).should.throw();
        });

        it('should not do anything if not a type we deal with', () => {
            let validateModelSpy = sinon.spy(file, 'validateModelFile');
            let validateScriptSpy = sinon.spy(file, 'validateScriptFile');
            let validateAclSpy = sinon.spy(file, 'validateAclFile');
            let validateQuerySpy = sinon.spy(file, 'validateQueryFile');

            let modelManager = new ModelManager();

            file['type'] = 'banana';

            file.validate();

            validateAclSpy.should.not.have.been.called;
            validateModelSpy.should.not.have.been.called;
            validateScriptSpy.should.not.have.been.called;
            validateQuerySpy.should.not.have.been.called;
        });
    });

    describe('getDisplayId', () => {
        it('should get the display id', () => {
            let result = file.getDisplayId();
            result.should.equal('fileDisplayID');
        });
    });
});
