import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';
import { Editor } from '../component/editor';
import { Test } from '../component/test';
import { Import } from '../component/import';
import { Deploy } from '../component/deploy';
import { Login } from '../component/login';
import { Replace } from '../component/replace';
import { AddFile } from '../component/add-file';
import { EditorFile } from '../component/editor-file';
import { ErrorAlert } from '../component/error-alert';
import { dragDropFile, waitForFileToExist, retrieveZipContentList } from '../utils/fileUtils';
import { BusyAlert } from '../component/alert';
import { Constants } from '../utils/constants';

import * as chai from 'chai';
import * as  fs from 'fs';
import * as JSZip from 'jszip';

let expect = chai.expect;

describe('Playground Tutorial Define', (() => {

  let baseTiles: Array<string> = null;
  let npmTiles: Array<string> = null;
  let sampleOptions;
  let networkName = 'tutorial-network';
  let profile = 'Web Browser';

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
      it('should allow a user to select the empty-business-network and call it tutorial network and deploy', (() => {

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
              return Deploy.clickDeploy();
          })
          .then(() => {
              return Deploy.waitToDisappear();
          })
          .then(() => {
              return BusyAlert.waitToDisappear();
          })
          .catch((err) => {
              fail(err);
          });
      }));
  }));

  describe('Connecting to the business network', (() => {
      it('should let the user connect to their sample network', (() => {
        let expectedFiles = ['About\nREADME.md', 'Access Control\npermissions.acl'];
          return Login.connectViaIdCard(profile, networkName)
          .then(() => {
              // Should now be on main editor page for the business network
              return Editor.waitToAppear();
          })
          .then(() => {
              // Should have the correct named busnet once loaded
              return Editor.waitForProjectFilesToLoad()
              .then(() => {
                  return Editor.retrieveDeployedPackageName()
              })
              .then((packageName) => {
                  expect(packageName).to.be.equal(networkName);
                  return Editor.retrieveNavigatorFileNames()
              })
              .then((filelist: any) => {
                  expect(filelist).to.be.an('array').lengthOf(2);
                  filelist.forEach((file) => {
                      expect(file).to.be.oneOf(expectedFiles);
                  });
                  return Editor.retrieveNavigatorFileActionButtons()
                  .then((buttonlist: any) => {
                      expect(buttonlist).to.be.an('array').lengthOf(2);
                      expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                      expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
                  });
              });
          })
          .catch((err) => {
              fail(err);
          })
      }));
  }));

  describe('Adding a model file', (() => {
      it('should let the user add a model file', (() => {
          return Editor.clickAddFile()
          .then(() => {
              return AddFile.waitToAppear();
          })
          .then(() => {
              return Editor.retrieveNavigatorFileNames()
          })
          .then((names) => {
              // Select radio option
              AddFile.selectAddModelViaRadioOption();
              // Add option becomes enabled
              AddFile.clickConfirmAdd();
              return names;
          })
          .then((startFiles) => {
              // -active file
              Editor.retrieveNavigatorActiveFiles()
              .then((list: any) => {
                  expect(list).to.be.an('array').lengthOf(1);
                  expect(list).to.include('Model File\nmodels/org.acme.model.cto');
              });
              // Check extracted against new template file that we should have in the list
              Editor.retrieveNavigatorFileNames()
              .then((filenames: any) => {
                  // We should have added one file
                  expect(filenames).to.be.an('array').lengthOf(startFiles.length + 1);
                  expect(filenames).to.include('Model File\nmodels/org.acme.model.cto');
                  // Previous files should still exist
                  startFiles.forEach((file) => {
                      expect(file).to.be.oneOf(filenames);
                  });
              });

              // Change the code in the model file
              let modelFileCode = fs.readFileSync(__dirname+'/../data/files/playground-tutorial/tutorial-model-file.cto', "utf8").trim();

              // Set the text for the model file in the code editor
              return EditorFile.setEditorCodeMirrorText(modelFileCode)
              .then(() => {
                  return EditorFile.retrieveEditorCodeMirrorText()
              })
              .then((text) => {
                  let lines = text.toString().split(/\r\n|\n/);
                  expect(lines.map(function(e){return e.trim();})).to.deep.equal(modelFileCode.split(/\r\n|\n/).map(function(e){return e.trim();})); // Use trim to handle that codemirror autotabs so file is formatted differently
                  return Editor.retrieveNavigatorFileActionButtons()
                  .then((buttonlist: any) => {
                      expect(buttonlist).to.be.an('array').lengthOf(2);
                      expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                      expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
                  });
              });
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
              return Editor.retrieveNavigatorFileNames()
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
              let scriptFileCode = fs.readFileSync(__dirname+'/../data/files/playground-tutorial/tutorial-script-file.js', "utf8").trim();

              // Set the text for the model file in the code editor
              EditorFile.setEditorCodeMirrorText(scriptFileCode)
              .then(() => {
                  // Check the correct text was set
                  return EditorFile.retrieveEditorCodeMirrorText()
              })
              .then((text) => {
                  let lines = text.toString().split(/\r\n|\n/);
                  expect(lines.map(function(e){return e.trim();})).to.deep.equal(scriptFileCode.split(/\r\n|\n/).map(function(e){return e.trim();})); // Use trim to handle that codemirror autotabs so file is formatted differently
              });

              Editor.retrieveNavigatorFileActionButtons()
              .then((buttonlist: any) => {
                  expect(buttonlist).to.be.an('array').lengthOf(2);
                  expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                  expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
              });
          })
          .catch((err) => {
              fail(err);
          });
      }));
  }));

  describe('Access', (() => {
      it('should have the correct acl file set', (() => {

          let aclFileCode = fs.readFileSync(__dirname+'/../data/files/playground-tutorial/tutorial-acl-file.acl', "utf8").trim();

          Editor.makeFileActive('permissions.acl')
          .then(() => {
              return EditorFile.retrieveEditorCodeMirrorText()
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

  describe('Deploying the updated business network', (() => {
      it('should have the right number of files', (() => {
          let expectedFiles = ['About\nREADME.md', 'Access Control\npermissions.acl', 'Model File\nmodels/org.acme.model.cto', 'Script File\nlib/script.js'];
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

      it('should be able to deploy the network', (() => {
          // update new item
          Editor.clickDeployBND();
          // -success message
          OperationsHelper.processExpectedSuccess();
          // -update disabled
          Editor.retrieveNavigatorFileActionButtons()
          .then((buttonlist: any) => {
              expect(buttonlist).to.be.an('array').lengthOf(2);
              expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
              expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
          })
          .catch((err) => {
              fail(err);
          });
      }))
  }));

  describe('Testing the business network defintion', (() => {
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
              expect(header[0]).to.deep.equal('Participant registry for org.acme.mynetwork.Trader');
          })
          .then(() => {
              return Test.retrieveParticipantTypes()
          })
          .then((participants) => {
              participants.forEach((participant) => {
                  expect(participant).to.be.oneOf(expectedParticipants);
              });
          })
          .then(() => {
              return Test.retrieveAssetTypes()
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
          let trader1 = fs.readFileSync(__dirname+'/../data/files/playground-tutorial/participants/TRADER1', "utf8").trim();

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
          let trader1 = fs.readFileSync(__dirname+'/../data/files/playground-tutorial/participants/TRADER1', "utf8").trim();
          let trader2 = fs.readFileSync(__dirname+'/../data/files/playground-tutorial/participants/TRADER2', "utf8").trim();

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
          let abc = fs.readFileSync(__dirname+'/../data/files/playground-tutorial/assets/ABC', "utf8").trim();

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
            let transaction = fs.readFileSync(__dirname+'/../data/files/playground-tutorial/transactions/ABCtoTRADER2', "utf8").trim();

            Test.submitTransaction(transaction, 'Trade')
            .then(() => {
              browser.sleep(1000); // give page a second to add the new element
              Test.retrieveRegistryItem()
              .then((assets) => {
                  expect(assets).to.be.an('array').lengthOf(1);
                  let asset = assets[0];

                  let data = JSON.parse(asset['data'].toString());
                  expect(data['owner']).to.deep.equal('resource:org.acme.mynetwork.Trader#TRADER2');
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
                                  expect(matchedItems).to.be.an('array').lengthOf(1)
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
                    })
              });
          });
        }));
    }));
}));
