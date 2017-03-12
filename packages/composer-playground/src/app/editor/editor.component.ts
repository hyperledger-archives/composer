import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {ImportComponent} from '../import/import.component';
import {ExportComponent} from '../export/export.component';
import {AddFileComponent} from '../add-file/add-file.component';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../initialization.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AlertService } from '../services/alert.service';

import {AclFile, BusinessNetworkDefinition, ModelFile} from 'composer-common';

import {saveAs} from 'file-saver';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/markdown-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/scroll/simplescrollbars';

import * as marked from 'marked';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: [
    './editor.component.scss'.toString()
  ]
})
export class EditorComponent implements OnInit {

  private files: any = [];
  private currentFile: any = null;
  private previousFile;
  private changingCurrentFile: boolean = false;
  private code: string = null;
  private readme = null;
  private previousCode: string = null;
  private codeConfig = {
    lineNumbers: true,
    lineWrapping: true,
    readOnly: false,
    mode: 'javascript',
    autofocus: true,
    extraKeys: {
      'Ctrl-Q': function (cm) {
        cm.foldCode(cm.getCursor());
      }
    },
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    scrollbarStyle: 'simple'
  };
  private addModelNamespace: string = 'org.acme.model';
  private addModelFileName: string = 'lib/org.acme.model.cto';
  private addScriptFileName: string = 'lib/script.js';
  private currentError: string = null;
  private noError: boolean = true;
  private dirty: boolean = false;
  private deploying: boolean = false;

  private businessNetworkDefinition: BusinessNetworkDefinition = null;

  private editActive: boolean = false; // Are the input boxes visible?
  private editingPackage: boolean = false; // Is the package.json being edited?

  private deployedPackageName; // This is the deployed BND's package name
  private deployedPackageVersion; // This is the deployed BND's package version
  private deployedPackageDescription; // This is the deployed BND's package description

  private inputPackageName; // This is the input 'Name' before the BND is updated
  private inputPackageVersion; // This is the input 'Version' before the BND is updated

  private newPackageJson;

  //Used incase deploy fails to still have the changes
  private savedFiles;

  private exportedData;

  constructor(private adminService: AdminService,
              private clientService: ClientService,
              private initializationService: InitializationService,
              private modalService: NgbModal,
              private route: ActivatedRoute,
              private sampleBusinessNetworkService: SampleBusinessNetworkService,
              private alertService: AlertService) {

  }

  ngOnInit(): Promise<any> {
    this.route.queryParams.subscribe(() => {
      if (this.sampleBusinessNetworkService.OPEN_SAMPLE) {
        this.openImportModal();
        this.sampleBusinessNetworkService.OPEN_SAMPLE = false;
      }
    });

    return this.initializationService.initialize()
      .then(() => {
        this.loadBusinessNetwork();

        this.deployedPackageName = this.businessNetworkDefinition.getMetadata().getName(); // Set Name
        this.deployedPackageVersion = this.businessNetworkDefinition.getMetadata().getVersion(); // Set Version
        this.deployedPackageDescription = this.businessNetworkDefinition.getMetadata().getDescription(); // Set Description
        this.newPackageJson = this.businessNetworkDefinition.getMetadata().getPackageJson();
        this.updateFiles();
        if (this.files.length) {
          let currentFile = this.files.find((file) => {
            return file.readme;
          });
          if (!currentFile) {
            currentFile = this.files[0];
          }
          this.setCurrentFile(currentFile);
        }
      });
  }

  private createBusinessNetwork(name, version, description, packageJson, readme) {
    this.businessNetworkDefinition = new BusinessNetworkDefinition(name + '@' + version, description, packageJson, readme); // Creates a new BND
    this.deployedPackageName = name;
    this.deployedPackageVersion = version;
    this.deployedPackageDescription = description;
  }

  private loadBusinessNetwork() {
    let sourceBusinessNetworkDefinition = this.clientService.getBusinessNetwork();

    let readme = sourceBusinessNetworkDefinition.getMetadata().getREADME();
    let packageJson = sourceBusinessNetworkDefinition.getMetadata().getPackageJson();


    let businessNetworkDefinition = new BusinessNetworkDefinition(sourceBusinessNetworkDefinition.getMetadata().getName() + '@' + sourceBusinessNetworkDefinition.getMetadata().getVersion(), sourceBusinessNetworkDefinition.getMetadata().getDescription(), packageJson, readme);

    sourceBusinessNetworkDefinition.getModelManager().getModelFiles()
      .map((modelFile) => {
        return modelFile.getDefinitions();
      })
      .forEach((modelFile) => {
        businessNetworkDefinition.getModelManager().addModelFile(modelFile);
      });
    sourceBusinessNetworkDefinition.getScriptManager().getScripts()
      .forEach((scriptFile) => {
        let script = businessNetworkDefinition.getScriptManager().createScript(scriptFile.getIdentifier(), scriptFile.getLanguage(), scriptFile.getContents());
        businessNetworkDefinition.getScriptManager().addScript(script);
      });
    let aclFile = sourceBusinessNetworkDefinition.getAclManager().getAclFile();
    if (aclFile) {
      aclFile = new AclFile('permissions.acl', businessNetworkDefinition.getModelManager(), aclFile.getDefinitions());
      businessNetworkDefinition.getAclManager().setAclFile(aclFile);
    }
    this.businessNetworkDefinition = businessNetworkDefinition;
    this.deployedPackageName = businessNetworkDefinition.getMetadata().getName();
    this.deployedPackageVersion = businessNetworkDefinition.getMetadata().getVersion();
    this.inputPackageName = businessNetworkDefinition.getMetadata().getName();
    this.inputPackageVersion = businessNetworkDefinition.getMetadata().getVersion();
  }

  private getCurrentCode() {
    let businessNetworkDefinition = this.businessNetworkDefinition;
    let modelManager = businessNetworkDefinition.getModelManager();
    let scriptManager = businessNetworkDefinition.getScriptManager();
    let aclManager = businessNetworkDefinition.getAclManager();
    if (this.currentFile.model) {
      let modelFile = modelManager.getModelFile(this.currentFile.id);
      if (modelFile) {
        return modelFile.getDefinitions();
      } else {
        return null;
      }
    } else if (this.currentFile.script) {
      let script = scriptManager.getScript(this.currentFile.id);
      if (script) {
        return script.getContents();
      } else {
        return null;
      }
    } else if (this.currentFile.acl) {
      let aclFile = aclManager.getAclFile();
      if (aclFile) {
        return aclFile.getDefinitions();
      } else {
        return null;
      }
    } else if (this.currentFile.package) {
      // This is what's loaded into the editor

      return JSON.stringify(this.newPackageJson);
    } else if (this.currentFile.readme) {
      let readme = this.businessNetworkDefinition.getMetadata().getREADME();
      if (readme) {
        return marked(readme);
      }
    }
    else {
      return null;
    }
  }

  private setCurrentCode() {
    let businessNetworkDefinition = this.businessNetworkDefinition;
    let modelManager = businessNetworkDefinition.getModelManager();
    let scriptManager = businessNetworkDefinition.getScriptManager();
    let aclManager = businessNetworkDefinition.getAclManager();
    try {
      if (this.currentFile.model) {
        let modelFile = new ModelFile(modelManager, this.code);
        if (this.currentFile.id !== modelFile.getNamespace()) {
          throw new Error(`The namespace cannot be changed and must be set to ${this.currentFile.id}`);
        }
        modelManager.addModelFile(modelFile);
      } else if (this.currentFile.script) {
        let script = scriptManager.createScript(this.currentFile.id, 'JS', this.code);
        scriptManager.addScript(script);
      } else if (this.currentFile.acl) {
        let aclFile = new AclFile(this.currentFile.id, modelManager, this.code);
        aclManager.setAclFile(aclFile);
      } else if (this.currentFile.package) {
        let packageObject = JSON.parse(this.code);
        this.deployedPackageName = packageObject.name;
        this.deployedPackageVersion = packageObject.version;
        this.deployedPackageDescription = packageObject.description;
        this.newPackageJson = packageObject;
        this.editingPackage = true;
      }
      this.currentError = null;
      this.noError = true;
      this.dirty = true;
    } catch (e) {
      this.currentError = e.toString();
      this.noError = false;
    }
  }

  private setCurrentFile(file) {
    this.changingCurrentFile = true;
    try {
      this.previousFile = this.currentFile;
      this.currentFile = file;
      //needs to be different as readme not shown in editor
      if (this.currentFile.readme) {
        this.readme = this.getCurrentCode();
      } else {
        this.code = this.getCurrentCode();
        this.previousCode = this.code;
        this.readme = null;
      }
    } finally {
      this.changingCurrentFile = false;
    }
  }

  private onCodeChanged() {
    if (this.changingCurrentFile) {
      return;
    } else if (this.code === this.previousCode) {
      return;
    }
    this.previousCode = this.code;
    this.setCurrentCode();
  }

  private updateFiles() {
    let businessNetworkDefinition = this.businessNetworkDefinition;
    let modelManager = businessNetworkDefinition.getModelManager();
    let modelFiles = modelManager.getModelFiles();
    let newFiles = [];

    modelFiles.forEach((modelFile) => {
      newFiles.push({
        model: true,
        id: modelFile.getNamespace(),
        displayID: 'lib/' + modelFile.getNamespace() + '.cto'
      });
    });

    let scriptManager = businessNetworkDefinition.getScriptManager();
    let scriptFiles = scriptManager.getScripts();
    scriptFiles.forEach((scriptFile) => {
      newFiles.push({
        script: true,
        id: scriptFile.getIdentifier(),
        displayID: scriptFile.getIdentifier()
      });
    });
    newFiles.sort((a, b) => {
      return a.displayID.localeCompare(b.displayID);
    });

    let aclManager = businessNetworkDefinition.getAclManager();
    let aclFile = aclManager.getAclFile();
    if (aclFile) {
      newFiles.push({
        acl: true,
        id: aclFile.getIdentifier(),
        displayID: aclFile.getIdentifier()
      });
    }

    let readme = businessNetworkDefinition.getMetadata().getREADME();
    if(readme) {
      //add it first so it appears at the top of the list
      newFiles.unshift({
        readme: true,
        id : 'readme',
        displayID: 'README.md'
      })
    }
    this.files = newFiles;
  }

  private addModelFile(contents = null) {
    let businessNetworkDefinition = this.businessNetworkDefinition;
    let modelManager = businessNetworkDefinition.getModelManager();
    let code;
    if (!contents) {
      code =
        `/**
  * New model file
  */

  namespace ${this.addModelNamespace}`;
    } else {
      code = contents;
    }

    modelManager.addModelFile(code);
    this.updateFiles();
    this.files.forEach((file) => {
      if (file.id === this.addModelNamespace) {
        this.setCurrentFile(file);
      }
    });
    this.dirty = true;
  }

  private addScriptFile(scriptFile = null) {
    let businessNetworkDefinition = this.businessNetworkDefinition;
    let scriptManager = businessNetworkDefinition.getScriptManager();
    let code;
    let script;
    if (!scriptFile) {
      code =
        `/**
  * New script file
  */`;
      script = scriptManager.createScript(this.addScriptFileName, 'JS', code);
    } else {
      script = scriptFile;
    }

    scriptManager.addScript(script);
    this.updateFiles();
    this.files.forEach((file) => {
      if (file.id === this.addScriptFileName) {
        this.setCurrentFile(file);
      }
    });
    this.dirty = true;
  }

  private deleteFile(file) {
    let businessNetworkDefinition = this.businessNetworkDefinition;
    let modelManager = businessNetworkDefinition.getModelManager();
    let scriptManager = businessNetworkDefinition.getScriptManager();
    if (file.model) {
      try {
        modelManager.deleteModelFile(file.id);
        this.updateFiles();
        if (file === this.currentFile) {
          if (this.files.length) {
            this.setCurrentFile(this.files[0]);
          } else {
            this.currentFile = null;
          }
        }
        this.dirty = true;
      } catch (e) {
        this.currentError = e.toString();
        this.noError = false;
      }
    } else if (file.script) {
      try {
        scriptManager.deleteScript(file.id);
        this.updateFiles();
        if (file === this.currentFile) {
          if (this.files.length) {
            this.setCurrentFile(this.files[0]);
          } else {
            this.currentFile = null;
          }
        }
        this.dirty = true;
      } catch (e) {
        this.currentError = e.toString();
        this.noError = false;
      }
    }
  }

  private openImportModal() {
    this.modalService.open(ImportComponent).result.then((result) => {
      this.loadBusinessNetwork();
      this.updateFiles();
      if (this.files.length) {
        let currentFile = this.files.find((file) => {
          return file.readme;
        });
        if (!currentFile) {
          currentFile = this.files[0];
        }
        this.setCurrentFile(currentFile);
        this.alertService.successStatus$.next('Business Network successfully imported and deployed');
        this.newPackageJson = this.businessNetworkDefinition.getMetadata().getPackageJson();
        this.inputPackageName = this.businessNetworkDefinition.getName();
        this.inputPackageVersion = this.businessNetworkDefinition.getVersion();
        this.deployedPackageName = this.businessNetworkDefinition.getName();
        this.deployedPackageVersion = this.businessNetworkDefinition.getVersion();
        this.deployedPackageDescription = this.businessNetworkDefinition.getDescription();

      }
    }, (reason) => {
      // if no reason then we hit cancel
      if (reason) {
        this.alertService.errorStatus$.next(reason);
      }
    });
  }

  private openExportModal() {
    return this.businessNetworkDefinition.toArchive().then((exportedData) => {
      let file = new File([exportedData],
        this.deployedPackageName + '.bna',
        {type: 'application/octet-stream'});
      saveAs(file);

      this.modalService.open(ExportComponent);

    });
  }

  private openAddFileModal() {
    let modalRef = this.modalService.open(AddFileComponent);
    modalRef.componentInstance.businessNetwork = this.businessNetworkDefinition;
    modalRef.result
      .then((result) => {
        if (result !== 0) {
          if (result instanceof ModelFile) {
            this.addModelFile(result);
          } else {
            this.addScriptFile(result);
          }
        }
      }).catch(() => {
    }); // Ignore this, only there to prevent crash when closed
  }

  private deploy(): Promise<any> {
    // Gets the definition for the currently deployed business network

    this.saveCurrentDefinitionFiles();
    this.alertService.busyStatus$.next('Deploying updated business network ...');
    return Promise.resolve()
      .then(() => {
        if (this.deploying) {
          return;
        }
        this.deploying = true;
        //TODO: shouldn't need to do this should just be able to update the business network definition
        // Creates a new business network with the package name, version and description set. (Will have no definitions)
        this.createBusinessNetwork(this.deployedPackageName, this.deployedPackageVersion, this.deployedPackageDescription, this.newPackageJson, this.businessNetworkDefinition.getMetadata().getREADME());
        this.setCurrentDefinitionFiles();
        return this.adminService.update(this.businessNetworkDefinition)
      })
      .then(() => {
        this.dirty = false;
        this.deploying = false;
        return this.clientService.refresh();
      })
      .then(() => {
        //TODO: put this back in when roundtrip correctly
        //this.loadBusinessNetwork();
        this.updateFiles();



        this.deployedPackageName = this.businessNetworkDefinition.getMetadata().getName();
        this.deployedPackageVersion = this.businessNetworkDefinition.getMetadata().getVersion();
        this.inputPackageName = this.businessNetworkDefinition.getMetadata().getName();
        this.inputPackageVersion = this.businessNetworkDefinition.getMetadata().getVersion();

        this.editingPackage = false;

        if (this.previousFile == null) {
          this.setCurrentFile(this.currentFile);
        }
        else {
          this.setCurrentFile(this.previousFile);
        }
        this.alertService.busyStatus$.next(null);
        this.alertService.successStatus$.next('Business Network Deployed Successfully');
      })
      .catch((error) => {
        this.deploying = false;
        this.alertService.errorStatus$.next(error);
      });
  }

  /*
   * Gets the definition files for the currently deployed business network.
   */
  private saveCurrentDefinitionFiles() {
    let modelManager = this.businessNetworkDefinition.getModelManager();
    let scriptManager = this.businessNetworkDefinition.getScriptManager();
    let aclManager = this.businessNetworkDefinition.getAclManager();
    let modelFiles = modelManager.getModelFiles();
    let scriptFiles = scriptManager.getScripts();
    let aclFile = aclManager.getAclFile();
    let readme = this.businessNetworkDefinition.getMetadata().getREADME();
    let packageJson = this.businessNetworkDefinition.getMetadata().getREADME();

    this.savedFiles = {
      modelFiles : modelFiles,
      scriptFiles : scriptFiles,
      aclFile : aclFile,
      readme : readme
    };
  }

  /*
   * Adds the retrieved definition files to the currently deployed business network.
   */
  private setCurrentDefinitionFiles() {
    this.savedFiles.modelFiles.forEach((modelFile) => {
      this.businessNetworkDefinition.getModelManager().addModelFile(modelFile);
    });
    this.savedFiles.scriptFiles.forEach((scriptFile) => {
      let script = this.businessNetworkDefinition.getScriptManager().createScript(scriptFile.getIdentifier(), scriptFile.getLanguage(), scriptFile.getContents());
      this.businessNetworkDefinition.getScriptManager().addScript(script);
    });
    let aclFile = this.savedFiles.aclFile;
    if (aclFile) {
      aclFile = new AclFile('permissions.acl', this.businessNetworkDefinition.getModelManager(), aclFile.getDefinitions());
      this.businessNetworkDefinition.getAclManager().setAclFile(aclFile);
    }
  }


  /*
   * Swaps the toggle state. Used when editing Name and Version, will show input boxes.
   */
  private toggleEditActive() {
    this.editActive = !this.editActive;
  }

  /*
   * When user edits the package name (in the input box), the package.json needs to be updated, and the BND needs to be updated
   */
  private editPackageName() {
    this.deployedPackageName = this.inputPackageName;
    this.newPackageJson.name = this.inputPackageName;
    this.deploy().then(() => {
      if (this.previousFile == null) {
        this.setCurrentFile(this.currentFile);
      }
      else {
        this.setCurrentFile(this.previousFile);
      }
    });

    this.editActive = false;
  }

  /*
   * When user edits the package version (in the input box), the package.json needs to be updated, and the BND needs to be updated
   */
  private editPackageVersion() {
    this.deployedPackageVersion = this.inputPackageVersion;
    this.newPackageJson.version = this.inputPackageVersion;
    this.deploy().then(() => {
      if (this.previousFile == null) {
        this.setCurrentFile(this.currentFile);
      }
      else {
        this.setCurrentFile(this.previousFile);
      }
    });

    this.editActive = false;
  }

  private hideEdit() {
    this.toggleEditActive();
    this.editingPackage = true;
  }

  private stopEditing(){
    if(this.editingPackage){
      this.editActive = false;
      this.editingPackage = false;
      this.setCurrentFile(this.previousFile);
    }
  }


}
