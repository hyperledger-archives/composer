import { browser, element, by  } from 'protractor';
import { ExpectedConditions } from 'protractor';
import { OperationsHelper } from '../utils/operations-helper.ts';
import { EditorHelper } from '../utils/editor-helper.ts';
import { ImportModalHelper } from '../utils/import-helper.ts';
import { ReplaceModalHelper } from '../utils/replace-helper.ts';
import { AddFileModalHelper } from '../utils/add-file-helper.ts';
import { EditorFileHelper } from '../utils/editor-file-helper.ts';
import { dragDropFile, waitForFileToExist, retrieveZipContentList } from '../utils/fileUtils.ts';

import * as chai from 'chai';
import * as  fs from 'fs';

let should = chai.should();

describe('Editor Define', (() => {

  describe('On initialise', (() => {

    // Navigate to Editor base page and move past welcome splash
    beforeAll(() =>  {
        browser.get(browser.baseUrl);
        OperationsHelper.navigatePastWelcomeAndLogin();
    });

    it('should initialise the side navigation with basic sample network', (() => {
        // Check Files (Basic Sample Files) Present and clickable
        // -within <div class="side-bar-nav"><div class="flex-container">
        let expectedFiles = ['About\nREADME.md', 'Model File\nmodels/sample.cto', 'Script File\nlib/sample.js', 'Access Control\npermissions.acl'];
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            // Check extracted against expected
            for (let i = 0; i < expectedFiles.length; i++) {
                list[i].should.be.equal(expectedFiles[i]);
            }
        });

        // Check Actions (AddFile/Deploy) Present and clickable
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then( (list: any) => {
            // Check extracted against expected
            list.length.should.equal(2);
            list[0].text.should.be.equal('+ Add a file...');
            list[0].enabled.should.be.equal(true);
            list[1].text.should.be.equal('Deploy');
            list[1].enabled.should.be.equal(false);
        });

        // Check Actions (Import/Export)
        EditorHelper.retrieveBusinessArchiveActionButtons()
        .then( (list: any) => {
            // Check extracted against expected
            list.length.should.equal(2);
            list[0].text.should.be.equal('Import/Replace');
            list[0].enabled.should.be.equal(true);
            list[1].text.should.be.equal('Export');
            list[1].enabled.should.be.equal(true);
        });
    }));
  }));

  describe('Import BND button', (() => {
    // Navigate to Editor base page and move past welcome splash
    beforeAll(() =>  {
        browser.get(browser.baseUrl);
        OperationsHelper.navigatePastWelcomeAndLogin();
    });

    // Press the 'Import' button
    beforeEach(() =>  {
        EditorHelper.importBND()
        .then(() => {
            ImportModalHelper.waitForImportModalToAppear();
        });
    });

    it('should enable cancel of BNA import', (() => {
        // Select BNA
        ImportModalHelper.selectBusinessNetworkDefinitionFromFile('./e2e/data/bna/unnamed-network.bna');

        // Replace confirm should show, cancel it
        ReplaceModalHelper.cancelReplace();
        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.replace'))), 10000);

        // Cancel import modal
        ImportModalHelper.cancelImport();
        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);

        // -expected files in navigator (unchanged)
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            list.length.should.be.equal(4);
        });

        // -deploy not enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(false);
        });

    }));

    it('should enable empty BNA import via file selection', (() => {
        // Select BNA
        ImportModalHelper.selectBusinessNetworkDefinitionFromFile('./e2e/data/bna/unnamed-network.bna');

        // Replace confirm should show, confirm it
        ReplaceModalHelper.confirmReplace();

        // Check that the import has succeeded
        // -import modal disappears
        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);
        // -success message
        browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 10000);
        // -expected files in navigator (Just a readme)
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            list.should.be.deep.equal([ 'About\nREADME.md' ]);
        });
        // -deploy not enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(false);
        });
    }));

    it('should enable populated BNA import via file selection', (() => {
        // Select BNA
        ImportModalHelper.selectBusinessNetworkDefinitionFromFile('./e2e/data/bna/importBNA.bna');

        // Replace confirm should show, confirm it
        ReplaceModalHelper.confirmReplace();

        // Check that the import has succeeded
        // -import modal disappears
        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);
        // -success message
        browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 10000);
        // -expected files in navigator
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            let expectedFiles = ['About\nREADME.md', 'Model File\nmodels/sample.cto', 'Script File\nlib/sample.js', 'Access Control\npermissions.acl', 'Query File\nqueries.qry'];
            list.should.be.deep.equal(expectedFiles);
        });
        // -deploy not enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(false);
        });
    }));

  }));

  describe('Export BND button', (() => {

    // Navigate to Editor base page and move past welcome splash
    beforeAll(() =>  {
        browser.get(browser.baseUrl);
        OperationsHelper.navigatePastWelcomeAndLogin();
    });

    it('should export BNA named as the package name', (() => {
        let filename;
        EditorHelper.retrieveDeployedPackageName()
        .then((name) => {
            // Housekeeping for file download
            filename = './e2e/downloads/' + name + '.bna';
            if (fs.existsSync(filename)) {
                // Make sure the browser doesn't have to rename the download.
                fs.unlinkSync(filename);
            }
        })
        .then(() => {
          EditorHelper.exportBND();
          waitForFileToExist(filename)
          .then(() => {
              return retrieveZipContentList(filename);
          })
          .then((contents) => {
            // -should have known contents
            let expectedContents = [ 'package.json',
                                     'README.md',
                                     'permissions.acl',
                                     'models/',
                                     'models/sample.cto',
                                     'lib/',
                                     'lib/sample.js',
                                     'queries.qry' ];
            contents.length.should.be.equal(expectedContents.length);
            expectedContents.forEach((element) => {
                contents.includes(element).should.be.true;
            });
          });
        })
        .finally(() => {
            // ExportBND appears to kick off processes that cause timeout in protractor
            // -current work around is to refresh the page before continuing tests
            // -this was previously at the start as a beforeEach, but consumes time
            OperationsHelper.navigatePastWelcomeAndLogin();
        });
    }));
  }));

  describe('Add File button', (() => {

    let startFiles = [  'About\nREADME.md',
                        'Model File\nmodels/sample.cto',
                        'Script File\nlib/sample.js',
                        'Access Control\npermissions.acl'];

    // Navigate to Editor base page and move past welcome splash
    beforeAll(() =>  {
        browser.get(browser.baseUrl);
        OperationsHelper.navigatePastWelcome();
    });

    // Reset the BNA and then press the 'AddFile' button
    beforeEach(() =>  {

        EditorHelper.importBND()
        .then(() => {
            ImportModalHelper.waitForImportModalToAppear();
            ImportModalHelper.selectBusinessNetworkDefinitionFromFile('./e2e/data/bna/basic-sample-network.bna');
            ReplaceModalHelper.confirmReplace();
            browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);
            browser.wait(ExpectedConditions.invisibilityOf(element(by.id('success_notify'))), 10000);

            EditorHelper.addFile()
            .then(() => {
                AddFileModalHelper.waitForAddFileModalToAppear();
            });
        });
    });

    it('should bring up an AddFile modal that can be closed by cancel button', (() => {
        AddFileModalHelper.cancelAdd();

        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);
        // -deploy not enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(false);
        });
    }));

    it('should bring up an AddFile modal that can be closed by X button', (() => {
        AddFileModalHelper.exitAdd();

        browser.wait(ExpectedConditions.invisibilityOf(element(by.css('.import'))), 10000);
        // -deploy not enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(false);
        });
    }));

    it('should prevent the addition of a file with an invalid file extension', (() => {
        let inputFileElement = element(by.id('file-importer_input'));
        dragDropFile(inputFileElement, './e2e/data/files/importBanned.wombat');
        browser.wait(ExpectedConditions.visibilityOf(element(by.css('.error'))), 10000);
        element(by.id('error_close')).click();
        AddFileModalHelper.exitAdd();
    }));

    it('should enable the cancelling of script file addition part way through without completing the file addition', (() => {
        AddFileModalHelper.selectScriptRadioOption();

        // Add option becomes enabled, but we want to cancel instead
        AddFileModalHelper.cancelAdd();

        // Check we do not have a template script file added
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            list.includes('Script File\nlib/script.js').should.be.false;
        });
        // -deploy not enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(false);
        });
    }));

    it('should enable the cancelling of model file addition part way through without completing the file addition', (() => {
        AddFileModalHelper.selectModelRadioOption();

        // Add option becomes enabled, but we want to cancel instead
        AddFileModalHelper.cancelAdd();

        // Check we do not have a template model file added
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            list.includes('Model File\nlmodels/org.acme.model.cto').should.be.false;
        });
        // -deploy not enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(false);
        });
    }));

    it('should enable the addition of a script file via radio button selection', (() => {
        AddFileModalHelper.selectScriptRadioOption();
        AddFileModalHelper.confirmAdd();
        browser.waitForAngularEnabled(false);
        // Check extracted against new template file that we should have in the list
        EditorHelper.retrieveNavigatorFileNames()
        .then((list: any) => {
            // Previous files should still exist
            startFiles.forEach((element) => {
                list.includes(element).should.be.true;
            });
            // We should have added one file
            list.length.should.be.equal(startFiles.length + 1);
            list.includes('Script File\nlib/script.js').should.be.true;
            browser.waitForAngularEnabled(true);
        });
        // -deploy enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(true);
        });
        // -active file
        EditorHelper.retrieveNavigatorActiveFile()
        .then((list: any) => {
            list.length.should.equal(1);
            list.includes('Script File\nlib/script.js').should.be.true;
        });
        // deploy new item
        EditorHelper.deployBND()
        .then(() => {
            // -success message
            browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 10000);
            // -deploy disabled
            EditorHelper.retrieveNavigatorFileActionButtons()
            .then((array: any) => {
                array[1].enabled.should.be.equal(false);
            });
        });
    }));

    it('should enable the addition of a script file via file input event', (() => {
        AddFileModalHelper.selectFromFile('./e2e/data/files/importScript.js');
        browser.waitForAngularEnabled(false);
        // Check extracted against new file that we should have in the list
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            // Previous files should still exist
            startFiles.forEach((element) => {
                list.includes(element).should.be.true;
            });
            // We should have added one file
            list.length.should.be.equal(startFiles.length + 1);
            list.includes('Script File\nlib/importScript.js').should.be.true;
            browser.waitForAngularEnabled(true);
        });
        // -deploy enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(true);
        });
        // -active file
        EditorHelper.retrieveNavigatorActiveFile()
        .then((list: any) => {
            list.length.should.equal(1);
            list.includes('Script File\nlib/importScript.js').should.be.true;
        });
        // deploy new item
        EditorHelper.deployBND()
        .then(() => {
            // -success message
            browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 10000);
            // -deploy disabled
            EditorHelper.retrieveNavigatorFileActionButtons()
            .then((array: any) => {
                array[1].enabled.should.be.equal(false);
            });
        });
    }));

    it('should enable the addition of a model file via radio button selection', (() => {
        AddFileModalHelper.selectModelRadioOption();
        AddFileModalHelper.confirmAdd();
        browser.waitForAngularEnabled(false);
        // -active file
        EditorHelper.retrieveNavigatorActiveFile()
        .then((list: any) => {
            list.length.should.equal(1);
            list[0].should.be.equal('Model File\nmodels/org.acme.model.cto');
            browser.waitForAngularEnabled(true);
        });
        // Check extracted against new template file that we should have in the list
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            // Previous files should still exist
            startFiles.forEach((element) => {
                list.includes(element).should.be.true;
            });
            // We should have added one file
            list.length.should.be.equal(startFiles.length + 1);
            list.includes('Model File\nmodels/org.acme.model.cto').should.be.true;
        });
        // -deploy enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(true);
        });
        // deploy new item
        EditorHelper.deployBND()
        .then(() => {
            // -success message
            browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 10000);
            // -deploy disabled
            EditorHelper.retrieveNavigatorFileActionButtons()
            .then((array: any) => {
                array[1].enabled.should.be.equal(false);
            });
        });
    }));

    it('should enable the addition of a model file via file input event', (() => {

        AddFileModalHelper.selectFromFile('./e2e/data/files/importModel.cto');

        browser.waitForAngularEnabled(false);
        // -active file
        EditorHelper.retrieveNavigatorActiveFile()
        .then((list: any) => {
            list.length.should.equal(1);
            list.includes('Model File\nmodels/importModel.cto').should.be.true;
            browser.waitForAngularEnabled(true);
        });
        // Check extracted against new file that we should have in the list
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            // Previous files should still exist
            startFiles.forEach((element) => {
                list.includes(element).should.be.true;
            });
            // We should have added one file
            list.length.should.be.equal(startFiles.length + 1);
            list.includes('Model File\nmodels/importModel.cto').should.be.true;
        });
        // -deploy enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(true);
        });
        // deploy new item
        EditorHelper.deployBND()
        .then(() => {
            // -success message
            browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 10000);
            // -deploy disabled
            EditorHelper.retrieveNavigatorFileActionButtons()
            .then((array: any) => {
                array[1].enabled.should.be.equal(false);
            });
        });
    }));

    it('should enable the addition of an ACL file via file input event', (() => {

        AddFileModalHelper.selectFromFile('./e2e/data/files/importACL.acl');
        ReplaceModalHelper.confirmReplace();

        browser.waitForAngularEnabled(false);
        // -active file
        EditorHelper.retrieveNavigatorActiveFile()
        .then((list: any) => {
            list.length.should.equal(1);
            list.should.contain('Access Control\npermissions.acl');
            browser.waitForAngularEnabled(true);
        });
        // Check code mirror for new contents (we only have one permissions file)
        EditorFileHelper.retrieveEditorCodeMirrorText()
        .then((text) => {
            text.should.contain('description: "Newly imported ACL file"');
        });

        // Check file list unchanged
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            // Previous files should still exist
            startFiles.forEach((element) => {
                list.should.contain(element);
            });
        });

        // -deploy enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(true);
        });
        // deploy new item
        EditorHelper.deployBND()
        .then(() => {
            // -success message
            browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 10000);
            // -deploy disabled
            EditorHelper.retrieveNavigatorFileActionButtons()
            .then((array: any) => {
                array[1].enabled.should.be.equal(false);
            });
        });
    }));

    it('should enable the addition of a Readme file via file input event', (() => {

        AddFileModalHelper.selectFromFile('./e2e/data/files/importReadMe.md');

        // Replace confirm modal should show
        ReplaceModalHelper.confirmReplace();
        // Check for new contents (we only have one readme file)
        // -active file
        EditorHelper.retrieveNavigatorActiveFile()
        .then((list: any) => {
            list.length.should.equal(1);
            list.includes('About\nREADME.md').should.be.true;
        });
        EditorFileHelper.retrieveEditorText()
        .then((text) => {
            text.should.contain('This is the NEW readme.');
        });
        // Check file list unchanged
        EditorHelper.retrieveNavigatorFileNames()
        .then( (list: any) => {
            // No new file (names)
            list.length.should.be.equal(startFiles.length);
            // Previous files should still exist
            startFiles.forEach((element) => {
                list.includes(element).should.be.true;
            });
        });
        // -deploy enabled
        EditorHelper.retrieveNavigatorFileActionButtons()
        .then((array: any) => {
            array[1].enabled.should.be.equal(true);
        });
        // deploy new item
        EditorHelper.deployBND()
        .then(() => {
            // -success message
            browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 10000);
            // -deploy disabled
            EditorHelper.retrieveNavigatorFileActionButtons()
            .then((array: any) => {
                array[1].enabled.should.be.equal(false);
            });
        });
    }));

    it('should warn about replacing current query file when adding new query file', (() => {
        AddFileModalHelper.exitAdd();

        EditorHelper.importBND()
        .then(() => {
            ImportModalHelper.waitForImportModalToAppear();
        })
        .then(() => {
            ImportModalHelper.selectBusinessNetworkDefinitionFromFile('./e2e/data/bna/importBNA.bna');
            ReplaceModalHelper.confirmReplace();
            browser.wait(ExpectedConditions.visibilityOf(element(by.id('success_notify'))), 10000);
        })
        .then(() => {
            EditorHelper.addFile()
            .then(() => {
                AddFileModalHelper.waitForAddFileModalToAppear();
            });
        })
        .then(() => {
            EditorHelper.retrieveNavigatorFileNames()
            .then((names) => {
                startFiles = names;
            });
        })
        .then(() => {
            AddFileModalHelper.selectFromFile('./e2e/data/files/importQuery.qry');
        })
        .then(() => {
            ReplaceModalHelper.confirmReplace();
        });
    }));

  }));

}));
