import { Component, OnInit } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ImportComponent } from '../import/import.component';

import { AdminService } from '../admin.service';
import { ClientService } from '../client.service';
import { InitializationService } from '../initialization.service';

import { AclFile, BusinessNetworkDefinition, ModelFile } from 'composer-common';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/markdown-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/scroll/simplescrollbars';

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
  private changingCurrentFile: boolean = false;
  private code: string = null;
  private previousCode: string = null;
  private codeConfig = {
    lineNumbers: true,
    lineWrapping: true,
    readOnly: false,
    mode: 'javascript',
    autofocus: true,
    extraKeys: { 'Ctrl-Q': function(cm) { cm.foldCode(cm.getCursor()); } },
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    scrollbarStyle: 'simple'
  };
  private addModelNamespace: string = 'org.acme.model';
  private addModelFileName: string = 'lib/org.acme.model.cto';
  private addScriptFileName: string = 'lib/script.js';
  private currentError: string = null;
  private dirty: boolean = false;
  private deploying: boolean = false;

  private businessNetworkDefinition: BusinessNetworkDefinition = null;

  private editActive: boolean = false;
  private editingPackage: boolean = false;

  private packageName; // This is the deployed BND's package name
  private packageVersion; // This is the deployed BND's package version
  private packageDescription; // This is the deployed BND's package description

  private inputPackageName; // This is the input 'Name' before the BND is updated
  private inputPackageVersion; // This is the input 'Version' before the BND is updated

  private setPackageName;
  private setPackageVersion;

  private currentModelFiles;
  private currentScriptFiles;
  private currentAclFile;

  private previousFile;

  constructor(
    private adminService: AdminService,
    private clientService: ClientService,
    private initializationService: InitializationService,
    private modalService: NgbModal
  ) {

  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {
        this.loadBusinessNetwork();



        this.packageName = this.businessNetworkDefinition.getName();
        this.packageVersion = this.businessNetworkDefinition.getVersion();
        this.packageDescription = this.businessNetworkDefinition.getDescription();

        this.setPackageName = this.businessNetworkDefinition.getName();
        this.setPackageVersion = this.businessNetworkDefinition.getVersion();

        this.updateFiles();
        if (this.files.length) {
          let currentFile = this.files.find((file) => {
            return file.model;
          });
          if (!currentFile) {
            currentFile = this.files[0];
          }
          this.setCurrentFile(currentFile);
        }
      });
  }

  private createBusinessNetwork(name,version,description){
    console.log('creating new bnd',arguments)
    this.businessNetworkDefinition = new BusinessNetworkDefinition(name+'@'+version,description);
  }

  private loadBusinessNetwork() {
    let businessNetworkDefinition = new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network');
    let sourceBusinessNetworkDefinition = this.clientService.getBusinessNetwork();
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
    this.setPackageName = businessNetworkDefinition.getName();
    this.setPackageVersion = businessNetworkDefinition.getVersion();
    this.inputPackageName = businessNetworkDefinition.getName();
    this.inputPackageVersion = businessNetworkDefinition.getVersion();
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
      let packageObject = {"name":this.packageName,"version":this.packageVersion,"description":this.packageDescription};
      return JSON.stringify(packageObject);
    } else {
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
      } else if (this.currentFile.package){
        let packageObject = JSON.parse(this.code);
        this.packageName = packageObject.name;
        this.packageVersion = packageObject.version;
        this.packageDescription = packageObject.description;
        this.editingPackage = true;
      }
      this.currentError = null;
      this.dirty = true;
    } catch (e) {
      this.currentError = e.toString();
    }
  }

  private setCurrentFile(file) {
    console.log('what is file?',file)
    this.changingCurrentFile = true;
    try {
      this.previousFile = this.currentFile;

      this.currentFile = file;
      this.code = this.getCurrentCode();
      this.previousCode = this.code;
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
    this.files = newFiles;
  }

  private addModelFile() {
    let businessNetworkDefinition = this.businessNetworkDefinition;
    let modelManager = businessNetworkDefinition.getModelManager();
    let code =
`/**
 * New model file
 */

namespace ${this.addModelNamespace}`;
    modelManager.addModelFile(code);
    this.updateFiles();
    this.files.forEach((file) => {
      if (file.id === this.addModelNamespace) {
        this.setCurrentFile(file);
      }
    });
    this.dirty = true;
  }

  private addScriptFile() {
    let businessNetworkDefinition = this.businessNetworkDefinition;
    let scriptManager = businessNetworkDefinition.getScriptManager();
    let code =
`/**
 * New script file
 */`;
    let script = scriptManager.createScript(this.addScriptFileName, 'JS', code);
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
      }
    }
  }

  private openImportModal() {
    this.modalService.open(ImportComponent).result.then((result) => {
      window.location.reload();
    }, (reason) => {
      //TODO: deal with error case
    });
  }

  private deploy(): Promise<any> {
    // Gets the definition for the currently deployed business network

    this.getCurrentDefinitionFiles();
    this.clientService.busyStatus$.next('Deploying updated business network ...');
    return Promise.resolve()
      .then(() => {
        if (this.deploying) {
          return;
        }
        this.deploying = true;
        // Creates a new business network with the package name, version and description set. (Will have no definitions)
        this.createBusinessNetwork(this.packageName,this.packageVersion,this.packageDescription);

        // Sets the business network to use the previous definition files
        this.setCurrentDefinitionFiles();

        return this.adminService.update(this.businessNetworkDefinition)
      })
      .then(() => {
        this.dirty = false;
        this.deploying = false;
        return this.clientService.refresh();
      })
      .then(() => {
        // this.loadBusinessNetwork();
        this.updateFiles();
        console.log('What is the BND?',this.businessNetworkDefinition);
        this.inputPackageVersion = this.packageVersion;
        this.inputPackageName = this.packageName;
        this.setPackageName = this.businessNetworkDefinition.getName();
        this.setPackageVersion = this.businessNetworkDefinition.getVersion();
        this.editingPackage = false;
        if(this.previousFile == null){
          this.setCurrentFile(this.currentFile);
        }
        else{
          this.setCurrentFile(this.previousFile);
        }
        this.clientService.busyStatus$.next(null);
      })
      .catch((error) => {
        this.deploying = false;
        this.clientService.errorStatus$.next(error);
      });
  }

  /*
  * Gets the definition files for the currently deployed business network.
  */
  private getCurrentDefinitionFiles(){
    let businessNetworkDefinition = this.businessNetworkDefinition;
    let modelManager = businessNetworkDefinition.getModelManager();
    let scriptManager = businessNetworkDefinition.getScriptManager();
    let aclManager = businessNetworkDefinition.getAclManager();
    let modelFiles = modelManager.getModelFiles();
    let scriptFiles = scriptManager.getScripts();
    let aclFile = aclManager.getAclFile();

    this.currentModelFiles = modelFiles;
    this.currentScriptFiles = scriptFiles;
    this.currentAclFile = aclFile;
  }

  /*
  * Adds the retrieved definition files to the currently deployed business network.
  */
  private setCurrentDefinitionFiles(){
      this.currentModelFiles.forEach((modelFile) => {
        this.businessNetworkDefinition.getModelManager().addModelFile(modelFile);
        console.log('added model')
      });
      this.currentScriptFiles.forEach((scriptFile) => {
        let script = this.businessNetworkDefinition.getScriptManager().createScript(scriptFile.getIdentifier(), scriptFile.getLanguage(), scriptFile.getContents());
        this.businessNetworkDefinition.getScriptManager().addScript(script);
        console.log('added script')
      });
    let aclFile = this.currentAclFile;
    if (aclFile) {
      aclFile = new AclFile('permissions.acl', this.businessNetworkDefinition.getModelManager(), aclFile.getDefinitions());
      this.businessNetworkDefinition.getAclManager().setAclFile(aclFile);
      console.log('added acl');
    }
  }


  /*
  * Swaps the toggle state. Used when editing Name and Version, will show input boxes.
  */
  private toggleEditActive(){
    this.editActive = !this.editActive;
  }

  /*
  * Swaps the toggle state if editing. Used for when the user selects outside of input boxes.
  */
  private toggleNotEditing(){
    if(this.editActive){
      this.editActive = !this.editActive;
    }
  }

  /*
  * When user edits the package name (in the input box), the package.json needs to be updated, and the BND needs to be updated
  */
  private editPackageName(){
    this.packageName = this.inputPackageName;
    this.deploy().then(()=>{
      if(this.previousFile == null){
        this.setCurrentFile(this.currentFile);
      }
      else{
        this.setCurrentFile(this.previousFile);
      }
      console.log('finished redeploy');
    });
  }

  /*
  * When user edits the package version (in the input box), the package.json needs to be updated, and the BND needs to be updated
  */
  private editPackageVersion(){
    this.packageVersion = this.inputPackageVersion;
    this.deploy().then(() => {
      if(this.previousFile == null){
        this.setCurrentFile(this.currentFile);
      }
      else{
        this.setCurrentFile(this.previousFile);
      }

      console.log('finished redeploy');
    });
  }

  private hideEdit(){
    this.toggleEditActive();
    this.editingPackage = true;
  }
}
