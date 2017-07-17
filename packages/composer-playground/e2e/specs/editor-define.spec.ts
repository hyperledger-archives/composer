import { browser, element, by } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper';
import { Editor } from '../component/editor';
import { Import } from '../component/import';
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

  // Navigate to Editor base page and move past welcome splash
  beforeAll(() =>  {
    browser.waitForAngularEnabled(false);
    OperationsHelper.navigatePastWelcome();
  });

  afterAll(() =>  {
    browser.waitForAngularEnabled(true);
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
            expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
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

  describe('Import BND button', (() => {

    // Press the 'Import' button
    beforeEach(() =>  {
        Editor.clickImportBND();
    });

    it('should enable cancel of BNA import', (() => {
        // Select BNA
        Import.selectBusinessNetworkDefinitionFromFile('./e2e/data/bna/unnamed-network.bna');

        // Replace confirm should show, cancel it
        Replace.cancelReplace();

        // Cancel import modal
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

        // -deploy not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
        });

    }));

    it('should enable empty BNA import via file selection', (() => {
        // Select BNA
        Import.selectBusinessNetworkDefinitionFromFile('./e2e/data/bna/unnamed-network.bna');

        // Replace confirm should show, confirm it
        Replace.confirmReplace();

        // Check that the import has succeeded
        // -import modal disappears
        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);
        // -success message
        OperationsHelper.processExpectedSuccess();
        // -expected files in navigator (Just a readme)
        Editor.retrieveNavigatorFileNames()
        .then((filelist: any) => {
            expect(filelist).to.be.an('array').lengthOf(1);
            expect(filelist).to.deep.equal(['About\nREADME.md']);
        });
        // -deploy not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
        });
    }));

    it('should enable populated BNA import via file selection', (() => {
        // Select BNA
        Import.selectBusinessNetworkDefinitionFromFile('./e2e/data/bna/basic-sample-network.bna');

        // Replace confirm should show, confirm it
        Replace.confirmReplace();

        // Check that the import has succeeded
        // -import modal disappears
        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);
        // -success message
        OperationsHelper.processExpectedSuccess();
        // -expected files in navigator (Just a readme)
        Editor.retrieveNavigatorFileNames()
        .then((filelist: any) => {
            let expectedFiles = ['About\nREADME.md', 'Model File\nmodels/sample.cto', 'Script File\nlib/sample.js', 'Access Control\npermissions.acl'];
            expect(filelist).to.be.an('array').lengthOf(4);
            filelist.forEach((file) => {
                expect(file).to.be.oneOf(expectedFiles);
            });
        });
        // -deploy not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
        });
    }));
  }));

  describe('Export BND button', (() => {

    it('should export BNA named as the package name', (() => {

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

  describe('Add File button', (() => {

    // Press the 'AddFile' button
    beforeEach(() =>  {
        Editor.clickAddFile()
        .then(() => {
            AddFile.waitForAddFileModalToAppear();
        });
    });

    it('should bring up an AddFile modal that can be closed by cancel button', (() => {
        AddFile.clickCancelAdd();

        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);
        // -deploy not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
        });
    }));

    it('should bring up an AddFile modal that can be closed by X button', (() => {
        AddFile.clickExitAdd();

        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);
        // -deploy not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
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
        // -deploy not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
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
        // -deploy not enabled
        Editor.retrieveNavigatorFileActionButtons()
        .then((buttonlist: any) => {
            expect(buttonlist).to.be.an('array').lengthOf(2);
            expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
            expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
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
            // // -deploy enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: true});
            });

            // -active file
            Editor.retrieveNavigatorActiveFile()
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
            // -deploy enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: true});
            });
            // -active file
            Editor.retrieveNavigatorActiveFile()
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
            Editor.retrieveNavigatorActiveFile()
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
            // -deploy enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: true});
            });
            // deploy new item
            Editor.clickDeployBND();
            // -success message
            OperationsHelper.processExpectedSuccess();
            // -deploy disabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
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
            Editor.retrieveNavigatorActiveFile()
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
            // -deploy enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: true});
            });
            // deploy new item
            Editor.clickDeployBND();
            // -success message
            OperationsHelper.processExpectedSuccess();
            // -deploy disabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
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
            Editor.retrieveNavigatorActiveFile()
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
            // -deploy enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: true});
            });
            // deploy new item
            Editor.clickDeployBND();
            // -success message
            OperationsHelper.processExpectedSuccess();
            // -deploy disabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
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
            Editor.retrieveNavigatorActiveFile()
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
            // -deploy enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: true});
            });
            // deploy new item
            Editor.clickDeployBND();
            // -success message
            OperationsHelper.processExpectedSuccess();
            // -deploy disabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
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
            Editor.retrieveNavigatorActiveFile()
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
            // -deploy enabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: true});
            });
            // deploy new item
            Editor.clickDeployBND();
            // -success message
            OperationsHelper.processExpectedSuccess();
            // -deploy disabled
            Editor.retrieveNavigatorFileActionButtons()
            .then((buttonlist: any) => {
                expect(buttonlist).to.be.an('array').lengthOf(2);
                expect(buttonlist[0]).to.deep.equal({text: '+ Add a file...', enabled: true});
                expect(buttonlist[1]).to.deep.equal({text: 'Deploy', enabled: false});
            });
        });
    }));

    it('should prevent the addition of a file with an invalid file extension', (() => {
        AddFile.selectFromFile('./e2e/data/files/importBanned.wombat');
        ErrorAlert.clickCloseError();
    }));
  }));

}));
