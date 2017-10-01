import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';
import { Editor } from '../component/editor';
import { Import } from '../component/import';
import { Login } from '../component/login';
import { Replace } from '../component/replace';
import { AddFile } from '../component/add-file';
import { EditorFile } from '../component/editor-file';
import { ErrorAlert } from '../component/error-alert';
import { dragDropFile, waitForFileToExist, retrieveZipContentList } from '../utils/fileUtils';

import * as chai from 'chai';
import * as  fs from 'fs';
import * as JSZip from 'jszip';

let expect = chai.expect;

describe('Editor Define', (() => {

  let baseTiles: Array<string> = null;
  let npmTiles: Array<string> = null;
  let sampleOptions;

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

  describe('On initialise', (() => {
    it('should initialise the side navigation with basic sample network', (() => {
        // Check Loaded Files (Basic Sample Files)
        let expectedFiles = ['About\nREADME.md', 'Model File\nmodels/sample.cto', 'Script File\nlib/sample.js', 'Access Control\npermissions.acl'];
        Editor.retrieveNavigatorFileNames()
        .then((filelist: any) => {
            expect(filelist).to.be.an('array').lengthOf(4);
            filelist.forEach((file) => {
                expect(file).to.be.oneOf(expectedFiles);
            });
        });
        // Check Actions (AddFile/Deploy) Present and clickable
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
        });
        // Check Actions (Import/Export)
        Editor.retrieveBusinessArchiveActionButtons()
        .then((actionlist: any) => {
            expect(actionlist).to.be.an('array').lengthOf(2);
            expect(actionlist[0]).to.deep.equal({text: 'Import/Replace', enabled: true});
            expect(actionlist[1]).to.deep.equal({text: 'Export', enabled: true});
        });
    }));
  }));

  describe('Export BND button', (() => {

      it('should export BNA named as the package name', (() => {
          Editor.waitForProjectFilesToLoad();

          Editor.retrieveDeployedPackageName()
          .then((packageName) => {
              let filename = './e2e/downloads/' + packageName + '.bna';
              if (fs.existsSync(filename)) {
                  // Make sure the browser doesn't have to rename the download.
                  fs.unlinkSync(filename);
              }
              return filename;
          })
          .then((filename) => {
               Editor.clickExportBND();
               return waitForFileToExist(filename)
               .then(() => { return retrieveZipContentList(filename); });
          })
          .then((contents) => {
              // -should have known contents
              let expectedContents = [ 'package.json',
                                          'README.md',
                                          'permissions.acl',
                                          'models/',
                                          'models/sample.cto',
                                          'lib/',
                                          'lib/sample.js' ];
              expect(contents).to.be.an('array').lengthOf(7);
              expect(contents).to.deep.equal(expectedContents);
          });
      }));
    }));

  describe('Import BND button', (() => {

    // Press the 'Import' button
    beforeEach(() =>  {
        Editor.clickImportBND();
        Import.waitToLoadBaseOptions();
        Import.waitToLoadNpmOptions();
    });

    it('should enable to close/cancel import slide out', (() => {
        Import.cancelImport();

        // -expected files in navigator (unchanged)
        let expectedFiles = ['About\nREADME.md', 'Model File\nmodels/sample.cto', 'Script File\nlib/sample.js', 'Access Control\npermissions.acl'];
        Editor.retrieveNavigatorFileNames()
        .then((filelist: any) => {
            expect(filelist).to.be.an('array').lengthOf(4);
            filelist.forEach((file) => {
                expect(file).to.be.oneOf(expectedFiles);
            });
        });

        // -update not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
        });

    }));

    it('should enable to cancel import import at replacement warning', (() => {
        // Select default item
        Import.confirmImport();

        // Cancel on replace warning
        Replace.cancelReplace();

        // -expected files in navigator (unchanged)
        let expectedFiles = ['About\nREADME.md', 'Model File\nmodels/sample.cto', 'Script File\nlib/sample.js', 'Access Control\npermissions.acl'];
        Editor.retrieveNavigatorFileNames()
        .then((filelist: any) => {
            expect(filelist).to.be.an('array').lengthOf(4);
            filelist.forEach((file) => {
                expect(file).to.be.oneOf(expectedFiles);
            });
        });

        // -update not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
        });

    }));

    it('should enable empty BNA import via tile selection', (() => {
        // Select Empty BNA
        Import.selectBaseImportOption('empty-business-network');

        // Replace confirm should show, confirm it
        Replace.confirmReplace();

        // Check that the import has succeeded
        // -import modal disappears
        Import.waitToDisappear();
        // -success message
        OperationsHelper.processExpectedSuccess();
        // -expected files in navigator (Just a readme)
        Editor.retrieveNavigatorFileNames()
        .then((filelist: any) => {
            expect(filelist).to.be.an('array').lengthOf(1);
            expect(filelist).to.deep.equal(['About\nREADME.md']);
        });
        // -update not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
        });
    }));

    it('should enable populated BNA import via file selection', (() => {
         // Select Basic Sample Network BNA
        Import.selectBaseImportOption('basic-sample-network');

        // Replace confirm should show, confirm it
        Replace.confirmReplace();

        // Check that the import has succeeded
        // -import modal disappears
        Import.waitToDisappear();
        // -success message
        OperationsHelper.processExpectedSuccess();
        // -expected files in navigator
        Editor.retrieveNavigatorFileNames()
        .then((filelist: any) => {
            let expectedFiles = ['About\nREADME.md', 'Model File\nmodels/sample.cto', 'Script File\nlib/sample.js', 'Access Control\npermissions.acl'];
            expect(filelist).to.be.an('array').lengthOf(4);
            filelist.forEach((file) => {
                expect(file).to.be.oneOf(expectedFiles);
            });
        });
        // -update not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
        });
    }));

    it('should enable import of npm hosted animaltracking-network', (() => {
        // Select & Confirm
        Import.selectNpmImportOption('animaltracking-network');
        Replace.confirmReplace();

        // Expect success
        Import.waitToDisappear();
        OperationsHelper.processExpectedSuccess();

    }));

    it('should enable import of npm hosted bond-network', (() => {
        // Select & Confirm
        Import.selectNpmImportOption('bond-network');
        Replace.confirmReplace();

        // Expect success
        Import.waitToDisappear();
        OperationsHelper.processExpectedSuccess();

    }));

    it('should enable import of npm hosted carauction-network', (() => {
        // Select & Confirm
        Import.selectNpmImportOption('carauction-network');
        Replace.confirmReplace();

        // Expect success
        Import.waitToDisappear();
        OperationsHelper.processExpectedSuccess();

    }));

    it('should enable import of npm hosted digitalproperty-network', (() => {
        // Select & Confirm
        Import.selectNpmImportOption('digitalproperty-network');
        Replace.confirmReplace();

        // Expect success
        Import.waitToDisappear();
        OperationsHelper.processExpectedSuccess();

    }));

    it('should enable import of npm hosted marbles-network', (() => {
        // Select & Confirm
        Import.selectNpmImportOption('marbles-network');
        Replace.confirmReplace();

        // Expect success
        Import.waitToDisappear();
        OperationsHelper.processExpectedSuccess();

    }));

    it('should enable import of npm hosted perishable-network', (() => {
        // Select & Confirm
        Import.selectNpmImportOption('perishable-network');
        Replace.confirmReplace();

        // Expect success
        Import.waitToDisappear();
        OperationsHelper.processExpectedSuccess();

    }));

    it('should enable import of npm hosted pii-network', (() => {
        // Select & Confirm
        Import.selectNpmImportOption('pii-network');
        Replace.confirmReplace();

        // Expect success
        Import.waitToDisappear();
        OperationsHelper.processExpectedSuccess();

    }));

    it('should enable import of npm hosted trade-network', (() => {
        // Select & Confirm
        Import.selectNpmImportOption('trade-network');
        Replace.confirmReplace();

        // Expect success
        Import.waitToDisappear();
        OperationsHelper.processExpectedSuccess();

    }));

    it('should enable import of npm hosted vehicle-lifecycle-network', (() => {
        // Select & Confirm
        Import.selectNpmImportOption('vehicle-lifecycle-network');
        Replace.confirmReplace();

        // Expect success
        Import.waitToDisappear();
        OperationsHelper.processExpectedSuccess();

    }));

  }));

  describe('Add File button', (() => {

    // Press the 'AddFile' button
    beforeEach(() =>  {
        Editor.clickAddFile()
        .then(() => {
            AddFile.waitToAppear();
        });
    });

    afterEach(() =>  {
        // Reset network to basic sample network
        OperationsHelper.importBusinessNetworkArchiveFromTile('basic-sample-network', true);
    });

    it('should bring up an AddFile modal that can be closed by cancel button', (() => {
        AddFile.clickCancelAdd();

        AddFile.waitToDisappear();
        // -update not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
        });
    }));

    it('should bring up an AddFile modal that can be closed by X button', (() => {
        AddFile.clickExitAdd();

        AddFile.waitToDisappear();
        // -update not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
        });
    }));

    it('should enable the cancelling of script file addition part way through without completing the file addition', (() => {
        AddFile.selectAddScriptViaRadioOption();

        // Add option becomes enabled, but we want to cancel instead
        AddFile.clickCancelAdd();

        // Check we do not have a template script file added
        Editor.retrieveNavigatorFileNames()
        .then( (list: any) => {
            expect(list).to.not.include('Script File\nlib/script.js');
        });
        // -update not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
        });
    }));

    it('should enable the cancelling of model file addition part way through without completing the file addition', (() => {
        AddFile.selectAddModelViaRadioOption();

        // Add option becomes enabled, but we want to cancel instead
        AddFile.clickCancelAdd();

        // Check we do not have a template model file added
        Editor.retrieveNavigatorFileNames()
        .then( (list: any) => {
            expect(list).to.not.include('Model File\nlmodels/org.acme.model.cto');
        });
        // -update not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: false});
        });
    }));

    it('should enable the addition of a script file via radio button selection', (() => {
        Editor.retrieveNavigatorFileNames()
        .then((names) => {
            AddFile.selectAddScriptViaRadioOption();
            return AddFile.clickConfirmAdd()
            .then(() => {
                return names;
            });
        })
        .then((startFiles) => {
            // Check extracted against new template file that we should have in the list
            Editor.retrieveNavigatorFileNames()
            .then((filenames: any) => {
                // We should have added one file
                expect(filenames).to.be.an('array').lengthOf(startFiles.length + 1);
                // Previous files should still exist
                startFiles.forEach((file) => {
                    expect(file).to.be.oneOf(filenames);
                });
                expect(filenames).to.include('Script File\nlib/script.js');
            });
            // // -update enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
            });

            // -active file
            Editor.retrieveNavigatorActiveFiles()
            .then((list: any) => {
                expect(list).to.be.an('array').lengthOf(1);
                expect(list).to.include('Script File\nlib/script.js');
            });
        });
    }));

    it('should enable the addition of a script file via file input event', (() => {
        Editor.retrieveNavigatorFileNames()
        .then((names) => {
            AddFile.selectFromFile('./e2e/data/files/importScript.js');
            // Add option becomes enabled
            AddFile.clickConfirmAdd();
            return names;
        })
        .then((startFiles) => {
            // Check extracted against new template file that we should have in the list
            Editor.retrieveNavigatorFileNames()
            .then((filenames: any) => {
                // We should have added one file
                expect(filenames).to.be.an('array').lengthOf(startFiles.length + 1);
                expect(filenames).to.include('Script File\nlib/importScript.js');
                // Previous files should still exist
                startFiles.forEach((file) => {
                    expect(file).to.be.oneOf(filenames);
                });
            });
            // -update enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
            });
            // -active file
            Editor.retrieveNavigatorActiveFiles()
            .then((list: any) => {
                expect(list).to.be.an('array').lengthOf(1);
                expect(list).to.include('Script File\nlib/importScript.js');
            });
        });
    }));

    it('should enable the addition of a model file via radio button selection', (() => {
        Editor.retrieveNavigatorFileNames()
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
            // -update enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
            });
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
            });
        });
    }));

    it('should enable the addition of a model file via file input event', (() => {

        Editor.retrieveNavigatorFileNames()
        .then((names) => {
            AddFile.selectFromFile('./e2e/data/files/importModel.cto');
            // Add option becomes enabled
            AddFile.clickConfirmAdd();
            return names;
        })
        .then((startFiles) => {
            // -active file
            Editor.retrieveNavigatorActiveFiles()
            .then((list: any) => {
                expect(list).to.be.an('array').lengthOf(1);
                expect(list).to.include('Model File\nmodels/importModel.cto');
            });
            // Check extracted against new file that we should have in the list
            Editor.retrieveNavigatorFileNames()
            .then((filenames: any) => {
                // We should have added one file
                expect(filenames).to.be.an('array').lengthOf(startFiles.length + 1);
                expect(filenames).to.include('Model File\nmodels/importModel.cto');
                // Previous files should still exist
                startFiles.forEach((file) => {
                    expect(file).to.be.oneOf(filenames);
                });
            });
            // -update enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
            });
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
            });
        });
    }));

    it('should enable the addition of an ACL file via file input event', (() => {
        Editor.retrieveNavigatorFileNames()
        .then((names) => {
            AddFile.selectFromFile('./e2e/data/files/importACL.acl');
            AddFile.clickConfirmAdd();
            Replace.confirmReplace();
            return names;
        })
        .then((startFiles) => {
            // -active file
            Editor.retrieveNavigatorActiveFiles()
            .then((list: any) => {
                expect(list).to.be.an('array').lengthOf(1);
                expect(list).to.include('Access Control\npermissions.acl');
            });
            // Check code mirror for new contents (we only have one permissions file)
            EditorFile.retrieveEditorCodeMirrorText()
            .then((text) => {
                expect(text).to.contain('description: "Newly imported ACL file"');
            });
            // Check file list unchanged
            Editor.retrieveNavigatorFileNames()
            .then((filenames) => {
                // No new file (names)
                expect(filenames).to.be.an('array').lengthOf(startFiles.length);
                // Previous files should still exist
                startFiles.forEach((file) => {
                    expect(file).to.be.oneOf(filenames);
                });
            });
            // -update enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
            });
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
            });
        });
    }));

    it('should enable the addition of an ACL file via radio button selection', (() => {
        AddFile.clickCancelAdd();
        OperationsHelper.importBusinessNetworkArchiveFromTile('empty-business-network', true);

        Editor.clickAddFile();
        AddFile.waitToAppear();

        Editor.retrieveNavigatorFileNames()
        .then((names) => {
            // Select radio option
            AddFile.selectAddAclViaRadioOption();
            // Add option becomes enabled
            AddFile.clickConfirmAdd();
            return names;
        })
        .then((startFiles) => {
            // -active file
            Editor.retrieveNavigatorActiveFiles()
            .then((list: any) => {
                expect(list).to.be.an('array').lengthOf(1);
                expect(list).to.include('Access Control\npermissions.acl');
            });
            // Check extracted against new template file that we should have in the list
            Editor.retrieveNavigatorFileNames()
            .then((filenames: any) => {
                // We should have added one file
                expect(filenames).to.be.an('array').lengthOf(startFiles.length + 1);
                expect(filenames).to.include('Access Control\npermissions.acl');
                // Previous files should still exist
                startFiles.forEach((file) => {
                    expect(file).to.be.oneOf(filenames);
                });
            });
            // -update enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
            });
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
            });
        });
    }));

    it('should enable the addition of a Readme file via file input event', (() => {
        Editor.retrieveNavigatorFileNames()
        .then((names) => {
            AddFile.selectFromFile('./e2e/data/files/importReadMe.md');
            AddFile.clickConfirmAdd();
            // Replace confirm modal should show
            Replace.confirmReplace();
            return names;
        })
        .then((startFiles) => {
            // Check for new contents (we only have one readme file)
            // -active file
            Editor.retrieveNavigatorActiveFiles()
            .then((list: any) => {
                expect(list).to.be.an('array').lengthOf(1);
                expect(list).to.include('About\nREADME.md');
            });
            EditorFile.retrieveEditorText()
            .then((text) => {
                expect(text).to.contain('This is the NEW readme.');
            });
            // Check file list unchanged
            Editor.retrieveNavigatorFileNames()
            .then((filenames) => {
                // No new file (names)
                expect(filenames).to.be.an('array').lengthOf(startFiles.length);
                // Previous files should still exist
                startFiles.forEach((file) => {
                    expect(file).to.be.oneOf(filenames);
                });
            });
            // -update enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
            });
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
            });
        });
    }));

    it('should enable the addition of a Query file via radio button selection', (() => {
        Editor.retrieveNavigatorFileNames()
        .then((names) => {
            // Select radio option
            AddFile.selectAddQueryViaRadioOption();
            // Add option becomes enabled
            AddFile.clickConfirmAdd();
            return names;
        })
        .then((startFiles) => {
            // -active file
            Editor.retrieveNavigatorActiveFiles()
            .then((list: any) => {
                expect(list).to.be.an('array').lengthOf(1);
                expect(list).to.include('Query File\nqueries.qry');
            });
            // Check extracted against new template file that we should have in the list
            Editor.retrieveNavigatorFileNames()
            .then((filenames: any) => {
                // We should have added one file
                expect(filenames).to.be.an('array').lengthOf(startFiles.length + 1);
                expect(filenames).to.include('Query File\nqueries.qry');
                // Previous files should still exist
                startFiles.forEach((file) => {
                    expect(file).to.be.oneOf(filenames);
                });
            });
            // -update enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
            });
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
            });
        });
    }));

    it('should enable the addition of a Query file via file input event', (() => {
        Editor.retrieveNavigatorFileNames()
        .then((names) => {
            AddFile.selectFromFile('./e2e/data/files/importQuery.qry');
            AddFile.clickConfirmAdd();
            return names;
        })
        .then((startFiles) => {
            // -active file
            Editor.retrieveNavigatorActiveFiles()
            .then((list: any) => {
                expect(list).to.be.an('array').lengthOf(1);
                expect(list).to.include('Query File\nqueries.qry');
            });
            EditorFile.retrieveEditorCodeMirrorText()
            .then((text) => {
                expect(text).to.contain('query Q1');
            });
            // Check file list unchanged
            Editor.retrieveNavigatorFileNames()
            .then((filenames) => {
                // One new file (names)
                expect(filenames).to.be.an('array').lengthOf(startFiles.length + 1);
                expect(filenames).to.include('Query File\nqueries.qry');
                // Previous files should still exist
                startFiles.forEach((file) => {
                    expect(file).to.be.oneOf(filenames);
                });
            });
            // -update enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Update', enabled: true});
            });
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
            });
        });
    }));

    it('should prevent the addition of a query file and/or acl file if one exists already', (() => {
        // Add a query file
        AddFile.selectFromFile('./e2e/data/files/importQuery.qry');
        AddFile.clickConfirmAdd();

        // Click add file
        Editor.clickAddFile();
        AddFile.waitToAppear();

        // Inspect radio button status
        AddFile.retrieveAddFileRadioButtons()
        .then((radioList: any) => {
            expect(radioList).to.be.an('array').lengthOf(4);
            expect(radioList).to.contain({name: 'file-type-cto', enabled: true});
            expect(radioList).to.contain({name: 'file-type-js', enabled: true});
            expect(radioList).to.contain({name: 'file-type-qry', enabled: false});
            expect(radioList).to.contain({name: 'file-type-acl', enabled: false});
        });

        AddFile.clickCancelAdd();

    }));

    it('should prevent the addition of a file with an invalid file extension', (() => {
        AddFile.selectFromFile('./e2e/data/files/importBanned.wombat');
        ErrorAlert.clickCloseError();
        ErrorAlert.waitToDisappear();
        AddFile.clickCancelAdd();
    }));
  }));

}));
