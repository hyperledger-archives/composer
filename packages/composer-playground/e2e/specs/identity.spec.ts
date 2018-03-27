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
import { BusyAlert } from '../component/alert';
import { Constants } from '../constants';
import { Deploy } from '../component/deploy';
import { Editor } from '../component/editor';
import { EditorFile } from '../component/editor-file';
import { Login } from '../component/login';
import { OperationsHelper } from '../utils/operations-helper';
import { Test } from '../component/test';
import { Identity } from '../component/identity';
import { IssueIdentity } from '../component/issue-identity';
import { IdentityIssued } from '../component/identity-issued';

import * as  fs from 'fs';
import * as chai from 'chai';
import { constants } from 'zlib';
let expect = chai.expect;

describe('Identity', (() => {

    let baseTiles: Array<string> = null;
    let npmTiles: Array<string> = null;
    let sampleOptions;
    const networkDetails = Constants.basicSampleNetwork;
    const profile = browser.params.profile;
    const isFabricTest = (profile !== 'Web Browser');

    // Navigate to Editor base page and move past welcome splash
    beforeAll(() =>  {
      // Important angular configuration and intial step passage to reach editor
      browser.waitForAngularEnabled(false);
      OperationsHelper.navigatePastWelcome();
    });

    afterAll(() =>  {
      browser.waitForAngularEnabled(true);
      browser.executeScript('window.sessionStorage.clear();');
      browser.executeScript('window.localStorage.clear();');
    });

    describe('Creating a new business network', (() => {
        it('should allow a user to select the basic-sample-network and deploy', () => {
          // Click to deploy on desired profile
          return Login.deployNewToProfile(profile)
          .then(() => {
              return Deploy.waitToAppear();
          })
          .then(() => {
              return Deploy.waitToLoadDeployBasisOptions();
          })
          .then(() => {
              return Deploy.selectDeployBasisOption(networkDetails.name);
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
          return Login.connectViaIdCard(profile, networkDetails.name)
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
                  expect(packageName).to.be.equal(networkDetails.name);
                  return Editor.retrieveNavigatorFileNames();
              })
              .then((filelist: any) => {
                  expect(filelist).to.be.an('array').lengthOf(4);
                  filelist.forEach((file) => {
                      expect(file).to.be.oneOf(networkDetails.files);
                  });
                  return Editor.retrieveUpdateBusinessNetworkButtons()
                  .then((buttonlist: any) => {
                      expect(buttonlist).to.be.an('array').lengthOf(2);
                      expect(buttonlist[1]).to.deep.equal({text: Constants.deployButtonLabel, enabled: true});
                  });
              });
          })
          .catch((err) => {
              fail(err);
          });
        }));
    }));

    describe('Creating a user to make an identity against', (() => {
        it('should open the test page', (() => {
            OperationsHelper.click(element(by.id('app_testbutton')))
            .then(() => {
                return Test.waitToAppear();
            })
            .then(() => {
                return Test.retrieveHeader();
            })
            .then((header) => {
                expect(header).deep.equal(networkDetails.registryHeaders.sampleParticipant);
            })
            .then(() => {
                return Test.retrieveParticipantTypes();
            })
            .then((participants) => {
                participants.forEach((participant) => {
                    expect(participant).to.be.oneOf(networkDetails.participants.map((el) => {
                        return el.type;
                    }));
                });
            })
            .then(() => {
                return Test.retrieveAssetTypes();
            })
            .then((assets) => {
                assets.forEach((asset) => {
                    expect(asset).to.be.oneOf(networkDetails.assets.map((el) => {
                        return el.type;
                    }));
                });
            })
            .catch((err) => {
                fail(err);
            });
        }));

        it('should create CONGA', (() => {
            let conga = fs.readFileSync(networkDetails.participants[0].example, 'utf8').trim();

            Test.selectRegistry('participants', networkDetails.participants[0].type)
            .then(() => {
              return Test.createRegistryItem(conga);
            })
            .then(() => {
              browser.sleep(Constants.shortWait); // give page a second to add the new element
              Test.retrieveRegistryItem()
              .then((participants) => {
                  expect(participants).to.be.an('array').lengthOf(1);
                  let participant = participants[0];
                  expect(participant).to.have.deep.property('id', 'CONGA');

                  let data = JSON.parse(participant['data'].toString());
                  expect(data).to.deep.equal(JSON.parse(conga));
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

    describe('Create an identity', () => {
        it('should load the identity page', () => {
            OperationsHelper.click(element(by.id('dropdownMenu1')))
            .then(() => {
                return OperationsHelper.click(element(by.id('content')));
            })
            .then(() => {
                return Identity.waitToAppear();
            })
            .then(() => {
                return Identity.getMyIds();
            })
            .then((myIDs) => {
                expect(myIDs.length).to.deep.equal(1);
                expect(myIDs[0].id).to.deep.equal('admin');
                expect(myIDs[0].status).to.deep.equal(Constants.myIDsStatuses.selected);
            })
            .then(() => {
                return Identity.getAllIds();
            })
            .then((allIDs) => {
                expect(allIDs.length).to.deep.equal(1);
                expect(allIDs[0].id).to.deep.equal('admin');
                expect(allIDs[0].issued).to.deep.equal('admin (NetworkAdmin)');
                expect(allIDs[0].status).to.deep.equal(Constants.allIDsStatuses.activated);
            });
        });

        it('should use the issue identity popup', () => {
            return OperationsHelper.click(element(by.id('issueID')))
            .then(() => {
                IssueIdentity.waitToAppear();
            })
            .then(() => {
                IssueIdentity.inputUserId('king_conga');
            })
            .then(() => {
                IssueIdentity.inputParticipant('CONGA');
            })
            .then(() => {
                IssueIdentity.selectParticipantType('CONGA', networkDetails.participants[0].type);
            })
            .then(() => {
                OperationsHelper.click((element(by.id('createNew'))));
            })
            .then(() => {
                if (isFabricTest) {
                    return IdentityIssued.waitToAppear()
                    .then(() => {
                        IdentityIssued.addToWallet(null);
                    });
                }
            })
            .then(() => {
                OperationsHelper.processExpectedSuccess();
            });
        });

        it('should have the identities issued', () => {
            return Identity.getMyIds()
            .then((myIDs) => {
                expect(myIDs.length).to.deep.equal(2);
                expect(myIDs[0].id).to.deep.equal('admin');
                expect(myIDs[0].status).to.deep.equal(Constants.myIDsStatuses.selected);
                expect(myIDs[1].id).to.deep.equal('king_conga');
                expect(myIDs[1].status).to.deep.equal(Constants.myIDsStatuses.inWallet);
            })
            .then(() => {
                return Identity.getAllIds();
            })
            .then((allIDs) => {
                expect(allIDs.length).to.deep.equal(2);
                expect(allIDs[0].id).to.deep.equal('admin');
                expect(allIDs[0].issued).to.deep.equal('admin (NetworkAdmin)');
                expect(allIDs[0].status).to.deep.equal(Constants.allIDsStatuses.activated);
                expect(allIDs[1].id).to.deep.equal('king_conga');
                expect(allIDs[1].issued).to.deep.equal(`CONGA (${networkDetails.participants[0].type})`);
                expect(allIDs[1].status).to.deep.equal(Constants.allIDsStatuses.issued);
            });
        });
    });

    describe('Delete a participant related to an ID', () => {
        it('should delete the participant', (() => {
            OperationsHelper.click(element(by.id('app_testbutton')))
            .then(() => {
                Test.waitToAppear();
            })
            .then(() => {
                return Test.deleteRegistryItem('CONGA');
            });
        }));
    });

    describe('Check that the identity warns that the participant is deleted', () => {
        it('should load the identity page and check they are warned', () => {
            OperationsHelper.click(element(by.id('dropdownMenu1')))
            .then(() => {
                return OperationsHelper.click(element(by.id('content')));
            })
            .then(() => {
                return Identity.waitToAppear();
            })
            .then(() => {
                return Identity.getMyIds();
            })
            .then((myIDs) => {
                expect(myIDs.length).to.deep.equal(2);
                expect(myIDs[0].id).to.deep.equal('admin');
                expect(myIDs[0].status).to.deep.equal(Constants.myIDsStatuses.selected);
                expect(myIDs[1].id).to.deep.equal('king_conga');
                expect(myIDs[1].status).to.deep.equal(Constants.myIDsStatuses.participantNotFound);
            })
            .then(() => {
                return Identity.getAllIds();
            })
            .then((allIDs) => {
                expect(allIDs.length).to.deep.equal(2);
                expect(allIDs[0].id).to.deep.equal('admin');
                expect(allIDs[0].issued).to.deep.equal('admin (NetworkAdmin)');
                expect(allIDs[0].status).to.deep.equal(Constants.allIDsStatuses.activated);
                expect(allIDs[1].id).to.deep.equal('king_conga');
                expect(allIDs[1].issued).to.deep.equal(`CONGA (${networkDetails.participants[0].type})`);
                expect(allIDs[1].status).to.deep.equal(Constants.allIDsStatuses.participantNotFound);
            });
        });
    });
}));
