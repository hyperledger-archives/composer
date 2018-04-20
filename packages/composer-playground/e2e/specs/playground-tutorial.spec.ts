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

import { ExpectedConditions, browser, element, by } from 'protractor';

import { AddFile } from '../component/add-file';
import { BusyAlert, SuccessAlert } from '../component/alert';
import { Constants } from '../constants';
import { Deploy } from '../component/deploy';
import { Editor } from '../component/editor';
import { EditorFile } from '../component/editor-file';
import { Login } from '../component/login';
import { OperationsHelper } from '../utils/operations-helper';
import { Test } from '../component/test';
import { Upgrade } from '../component/upgrade';

import * as  fs from 'fs';
import * as chai from 'chai';

let expect = chai.expect;

describe('Playground Tutorial Define', (() => {

    const deployButtonLabel = Constants.deployButtonLabel;

    let baseTiles: Array<string> = null;
    let npmTiles: Array<string> = null;
    let sampleOptions;
    const networkName = 'tutorial-network';
    const profile = browser.params.profile;
    const isFabricTest = (profile !== 'Web Browser');
    const tutorialCode = Constants.codeBlocks.playgroundTutorial;
    const defineCode = tutorialCode['files']['contents'];
    const testCode = tutorialCode['transactions'];

    // Navigate to Editor base page and move past welcome splash
    beforeAll(() => {
        // Important angular configuration and intial step passage to reach editor
        browser.waitForAngularEnabled(false);
        OperationsHelper.navigatePastWelcome();
    });

    afterAll(() => {
        browser.waitForAngularEnabled(true);
        browser.executeScript('window.sessionStorage.clear();');
        browser.executeScript('window.localStorage.clear();');
    });

    describe('Creating a new business network', (() => {
        it('should add the TestPeerAdmin card', () => {
            if (isFabricTest) {
                return Login.importBusinessNetworkCard(Constants.tempDir + '/' + Constants.peerAdminCardName)
                    .then(() => {
                        return SuccessAlert.waitToDisappear();
                    });
            }
        });

        it('should allow a user to select the empty-business-network and call it tutorial network and deploy', () => {

            // Click to deploy on desired profile
            return Login.deployNewToProfile(profile)
                .then(() => {
                    return Deploy.waitToAppear();
                })
                .then(() => {
                    return Deploy.waitToLoadDeployBasisOptions();
                })
                .then(() => {
                    return Deploy.selectDeployBasisOption('empty-business-network');
                })
                .then(() => {
                    return Deploy.clearBusinessNetworkName();
                })
                .then(() => {
                    return Deploy.nameBusinessNetwork(networkName);
                })
                .then(() => {
                    if (isFabricTest) {
                        return Deploy.selectUsernameAndSecret('admin', 'adminpw');
                    }
                    return;
                })
                .then(() => {
                    return Deploy.clickDeploy();
                })
                .then(() => {
                    return Deploy.waitToDisappear(isFabricTest);
                })
                .then(() => {
                    return BusyAlert.waitToDisappear();
                })
                .catch((err) => {
                    fail(err);
                });
        }, Constants.vlongwait);
    }));

    describe('Connecting to the business network', (() => {
        it('should let the user connect to their sample network', (() => {
            let expectedFiles = Constants.emptyBusinessNetwork.files;
            return Login.connectViaIdCard(profile, networkName)
                .then(() => {
                    // Should now be on main editor page for the business network
                    return Editor.waitToAppear();
                })
                .then(() => {
                    // Should have the correct named busnet once loaded
                    return Editor.waitForProjectFilesToLoad()
                        .then(() => {
                            return Editor.retrieveDeployedPackageName();
                        })
                        .then((packageName) => {
                            expect(packageName).to.be.equal(networkName);
                            return Editor.retrieveNavigatorFileNames();
                        })
                        .then((filelist: any) => {
                            expect(filelist).to.be.an('array').lengthOf(3);
                            filelist.forEach((file) => {
                                expect(file).to.be.oneOf(expectedFiles);
                            });
                            return Editor.retrieveUpdateBusinessNetworkButtons()
                                .then((buttonlist: any) => {
                                    expect(buttonlist).to.be.an('array').lengthOf(2);
                                    expect(buttonlist[1]).to.deep.equal({ text: deployButtonLabel, enabled: true });
                                });
                        });
                })
                .catch((err) => {
                    fail(err);
                });
        }), Constants.vlongwait);
        }));

    describe('Defining a model file', (() => {
        it('should let the user update the model file', (() => {

            let modelFileCode;

            return Editor.makeFileActive('models/model.cto')
                .then(() => {
                    // Change the code in the model file
                    modelFileCode = defineCode['model.cto'];

                    // Set the text for the model file in the code editor
                    return EditorFile.setEditorCodeMirrorText(modelFileCode);

                })
                .then(() => {
                    return EditorFile.retrieveEditorCodeMirrorText();
                })
                .then((text) => {
                    let lines = text.toString().split(/\r\n|\n/);
                    expect(lines.map((e) => {
                        return e.trim();
                    })).to.deep.equal(modelFileCode.split(/\r\n|\n/).map((e) => {
                        return e.trim();
                    })); // Use trim to handle that codemirror autotabs so file is formatted differently
                    return Editor.retrieveUpdateBusinessNetworkButtons();
                })
                .then((buttonlist: any) => {
                    expect(buttonlist).to.be.an('array').lengthOf(2);
                    expect(buttonlist[1]).to.deep.equal({ text: deployButtonLabel, enabled: true });
                })
                .catch((err) => {
                    fail(err);
                });
        }));
    }));

    describe('Adding a script file', (() => {
        it('should let the user add a script file', (() => {
            return Editor.clickAddFile()
                .then(() => {
                    return AddFile.waitToAppear();
                })
                .then(() => {
                    return Editor.retrieveNavigatorFileNames();
                })
                .then((names) => {
                    // Select radio option
                    AddFile.selectAddScriptViaRadioOption();
                    // Add option becomes enabled
                    AddFile.clickConfirmAdd();
                    return names;
                })
                .then((startFiles) => {
                    // -active file
                    Editor.retrieveNavigatorActiveFiles()
                        .then((list: any) => {
                            expect(list).to.be.an('array').lengthOf(1);
                            expect(list).to.include('Script File\nlib/script.js');
                        });
                    // Check extracted against new template file that we should have in the list
                    Editor.retrieveNavigatorFileNames()
                        .then((filenames: any) => {
                            // We should have added one file
                            expect(filenames).to.be.an('array').lengthOf(startFiles.length + 1);
                            expect(filenames).to.include('Script File\nlib/script.js');
                            // Previous files should still exist
                            startFiles.forEach((file) => {
                                expect(file).to.be.oneOf(filenames);
                            });
                        });

                    // Change the code in the model file
                    let scriptFileCode = defineCode['script.js'];

                    // Set the text for the model file in the code editor
                    EditorFile.setEditorCodeMirrorText(scriptFileCode)
                        .then(() => {
                            // Check the correct text was set
                            return EditorFile.retrieveEditorCodeMirrorText();
                        })
                        .then((text) => {
                            let lines = text.toString().split(/\r\n|\n/);
                            expect(lines.map((e) => {
                                return e.trim();
                            })).to.deep.equal(scriptFileCode.split(/\r\n|\n/).map((e) => {
                                return e.trim();
                            })); // Use trim to handle that codemirror autotabs so file is formatted differently
                        });

                    Editor.retrieveUpdateBusinessNetworkButtons()
                        .then((buttonlist: any) => {
                            expect(buttonlist).to.be.an('array').lengthOf(2);
                            expect(buttonlist[1]).to.deep.equal({ text: deployButtonLabel, enabled: true });
                        });
                })
                .catch((err) => {
                    fail(err);
                });
        }));
    }));

    describe('Access', (() => {
        it('should have the correct acl file set', (() => {

            let aclFileCode = fs.readFileSync(Constants.defaultACL, 'utf8').trim();

            Editor.makeFileActive('permissions.acl')
                .then(() => {
                    return EditorFile.retrieveEditorCodeMirrorText();
                })
                .then((text) => {
                    let lines = text.toString().split(/\r\n|\n/);
                    expect(lines).to.deep.equal(aclFileCode.split(/\r\n|\n/));
                })
                .catch((err) => {
                    fail(err);
                });
        }));
    }));

    describe('Upgrading the updated business network', (() => {
        it('should have the right number of files', (() => {
            let expectedFiles = Constants.emptyBusinessNetwork.files.concat(['Script File\nlib/script.js']);
            Editor.retrieveNavigatorFileNames()
                .then((filelist: any) => {
                    expect(filelist).to.be.an('array').lengthOf(4);
                    filelist.forEach((file) => {
                        expect(file).to.be.oneOf(expectedFiles);
                    });
                })
                .catch((err) => {
                    fail(err);
                });
        }));

        it('should be able to upgrade the network', () => {

            let upgradePromise;
            // update new item
            return Editor.clickDeployBND()
                .then(() => {
                    if (isFabricTest) {
                        return Upgrade.waitToAppear()
                            .then(() => {
                                return Upgrade.clickUpgrade();
                            });
                    }
                })
                .then(() => {
                    // -success message
                    OperationsHelper.processExpectedSuccess(Constants.vvlongwait);
                    // -update disabled
                    return Editor.retrieveUpdateBusinessNetworkButtons();
                })
                .then((buttonlist: any) => {
                    expect(buttonlist).to.be.an('array').lengthOf(2);
                    expect(buttonlist[1]).to.deep.equal({text: deployButtonLabel, enabled: false});
                })
                .catch((err) => {
                    fail(err);
                });
        }, Constants.vvlongwait);
    }));

    describe('Testing the business network definition', (() => {
        it('should open the test page', (() => {
            let expectedParticipants = ['Trader'];
            let expectedAssets = ['Commodity'];
            OperationsHelper.click(element(by.id('app_testbutton')))
                .then(() => {
                    return Test.waitToAppear();
                })
                .then(() => {
                    return Test.retrieveHeader();
                })
                .then((header) => {
                    expect(header).to.be.an('array').lengthOf(1);
                    expect(header[0]).to.deep.equal('Participant registry for org.example.mynetwork.Trader');
                })
                .then(() => {
                    return Test.retrieveParticipantTypes();
                })
                .then((participants) => {
                    participants.forEach((participant) => {
                        expect(participant).to.be.oneOf(expectedParticipants);
                    });
                })
                .then(() => {
                    return Test.retrieveAssetTypes();
                })
                .then((assets) => {
                    assets.forEach((asset) => {
                        expect(asset).to.be.oneOf(expectedAssets);
                    });
                })
                .catch((err) => {
                    fail(err);
                });
        }));
    }));

    describe('Creating participants', (() => {
        it('should create TRADER1', (() => {
            let trader1 = testCode.participants.trader1;

            Test.selectRegistry('participants', 'Trader')
                .then(() => {
                    return Test.createRegistryItem(trader1);
                })
                .then(() => {
                    browser.sleep(1000); // give page a second to add the new element
                    Test.retrieveRegistryItem()
                        .then((participants) => {
                            expect(participants).to.be.an('array').lengthOf(1);
                            let participant = participants[0];
                            expect(participant).to.have.deep.property('id', 'TRADER1');

                            let data = JSON.parse(participant['data'].toString());
                            expect(data).to.deep.equal(JSON.parse(trader1));
                        })
                        .catch((err) => {
                            fail(err);
                        });
                })
                .catch((err) => {
                    fail(err);
                });
        }));

        it('should create TRADER2', (() => {
            let trader1 = testCode.participants.trader1;
            let trader2 = testCode.participants.trader2;

            Test.selectRegistry('participants', 'Trader')
                .then(() => {
                    return Test.createRegistryItem(trader2);
                })
                .then(() => {
                    browser.sleep(1000); // give page a second to add the new element
                    Test.retrieveRegistryItem()
                        .then((participants) => {
                            expect(participants).to.be.an('array').lengthOf(2);
                            let participant0 = participants[0];
                            expect(participant0).to.have.deep.property('id', 'TRADER1');
                            let participant1 = participants[1];
                            expect(participant1).to.have.deep.property('id', 'TRADER2');

                            let data0 = JSON.parse(participant0['data'].toString());
                            expect(data0).to.deep.equal(JSON.parse(trader1));

                            let data1 = JSON.parse(participant1['data'].toString());
                            expect(data1).to.deep.equal(JSON.parse(trader2));
                        })
                        .catch((err) => {
                            fail(err);
                        });
                })
                .catch((err) => {
                    fail(err);
                });
        }));
    }));

    describe('Creating an asset', (() => {
        it('should create ABC', (() => {
            let abc = testCode.assets.abc;

            Test.selectRegistry('assets', 'Commodity')
                .then(() => {
                    return Test.createRegistryItem(abc);
                })
                .then(() => {
                    browser.sleep(1000); // give page a second to add the new element
                    Test.retrieveRegistryItem()
                        .then((assets) => {
                            expect(assets).to.be.an('array').lengthOf(1);
                            let asset = assets[0];
                            expect(asset).to.have.deep.property('id', 'ABC');

                            let data = JSON.parse(asset['data'].toString());
                            expect(data).to.deep.equal(JSON.parse(abc));
                        })
                        .catch((err) => {
                            fail(err);
                        });
                })
                .catch((err) => {
                    fail(err);
                });
        }));
    }));

    describe('Transferring the commodity between the participants', (() => {
        it('should transfer ABC from TRADER1 to TRADER2', (() => {
            let transaction = testCode.transactions.trade;

            Test.submitTransaction(transaction, 'Trade')
                .then(() => {
                    browser.sleep(1000); // give page a second to add the new element
                    Test.retrieveRegistryItem()
                        .then((assets) => {
                            expect(assets).to.be.an('array').lengthOf(1);
                            let asset = assets[0];

                            let data = JSON.parse(asset['data'].toString());
                            expect(data['owner']).to.deep.equal('resource:org.example.mynetwork.Trader#TRADER2');
                        })
                        .catch((err) => {
                            fail(err);
                        });
                });
        }));
    }));

    describe('Logging out of the business network', (() => {
        it('should log the user out', (() => {
            OperationsHelper.click(element(by.id('dropdownMenu1')))
                .then(() => {
                    OperationsHelper.click(element(by.id('footer')))
                        .then(() => {
                            browser.wait(ExpectedConditions.visibilityOf(element(by.css('.connection-profile'))), Constants.longWait)
                                .then(() => {
                                    browser.wait(ExpectedConditions.visibilityOf(element(by.css('.connection-profile'))), Constants.longWait)
                                        .then(() => {
                                            // Retrieve components under named connection-profile
                                            return element.all(by.css('.connection-profile')).filter((item) => {
                                                return item.element(by.css('.connection-profile-title')).getText()
                                                    .then((text) => {
                                                        if (text.includes(profile)) {
                                                            return true;
                                                        }
                                                    });
                                            })
                                                .then((matchedItems) => {
                                                    expect(matchedItems).to.be.an('array').lengthOf(1);
                                                    return matchedItems[0];
                                                })
                                                .then((matchedItem) => {
                                                    return matchedItem.all(by.css('.identity-card')).filter((item) => {
                                                        return item.element(by.css('.business-network-details')).getText()
                                                            .then((text) => {
                                                                if (text.includes(networkName)) {
                                                                    return true;
                                                                }
                                                            });
                                                    });
                                                })
                                                .then((cards) => {
                                                    expect(cards).to.be.an('array').lengthOf(1);
                                                });
                                        });
                                });
                        });
                });
        }));
    }));
}));
