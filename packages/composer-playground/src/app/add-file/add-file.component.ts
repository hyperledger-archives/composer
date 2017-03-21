import {Component, OnInit, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {BusinessNetworkDefinition, ModelFile} from 'composer-common';
import {AlertService} from '../services/alert.service';

@Component({
  selector: 'add-file-model',
  templateUrl: './add-file.component.html',
  styleUrls: ['./add-file.component.scss'.toString()]
})
export class AddFileComponent implements OnInit {

  @Input() businessNetwork: BusinessNetworkDefinition;

  currentFile = null;
  currentFileName = null;
  fileType = '';
  newFile = false;

  expandInput: boolean = false;

  maxFileSize: number = 5242880;
  supportedFileTypes: string[] = ['.js', '.cto'];

  addModelNamespace: string = 'org.acme.model';
  addModelFileName: string = 'lib/org.acme.model';
  addModelFileExtension: string = '.cto';
  addScriptFileName: string = 'lib/script';
  addScriptFileExtension: string = '.js';

  error = null;

  constructor(private alertService: AlertService,
              public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
  }

  removeFile() {
    this.expandInput = false;
    this.currentFile = null;
    this.currentFileName = null;
    this.fileType = '';
  }

  fileDetected() {
    this.expandInput = true;
  }

  fileLeft() {
    this.expandInput = false;
  }

  fileAccepted(file: File) {
    let type = file.name.substr(file.name.lastIndexOf('.') + 1);
    this.getDataBuffer(file)
      .then((data) => {
        switch (type) {
          case 'js':
            this.expandInput = true;
            this.createScript(file, data);
            break;
          case 'cto':
            this.expandInput = true;
            this.createModel(file, data);
            break;
          default:
            throw new Error('Unexpected File Type');
        }
      })
      .catch((err) => {
        this.fileRejected(err);
      });
  }

  getDataBuffer(file: File) {
    return new Promise((resolve, reject) => {
      let fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onload = () => {
        let dataBuffer = Buffer.from(fileReader.result);
        resolve(dataBuffer);
      };

      fileReader.onerror = (err) => {
        reject(err);
      };
    });
  }

  createScript(file: File, dataBuffer) {
    this.fileType = 'js';
    let scriptManager = this.businessNetwork.getScriptManager();
    this.currentFile = scriptManager.createScript(file.name || this.addScriptFileName, 'JS', dataBuffer.toString());
    this.currentFileName = this.currentFile.getIdentifier();
  }

  createModel(file: File, dataBuffer) {
    this.fileType = 'cto';
    let modelManager = this.businessNetwork.getModelManager();
    this.currentFile = new ModelFile(modelManager, dataBuffer.toString(), file.name || this.addModelFileName);
    this.currentFileName = this.currentFile.getFileName();
  }


  fileRejected(reason: string) {
    this.alertService.errorStatus$.next(reason);
  }

  changeCurrentFileType() {
    this.newFile = true;
    this.currentFile = null;
    if (this.fileType === 'js') {
      let code =
        `/**
 * New script file
 */`;
      let scriptManager = this.businessNetwork.getScriptManager();
      let existingScripts = scriptManager.getScripts();
      let filteredScripts = existingScripts.filter((script) => {
        let pattern = new RegExp(this.addScriptFileName + '\\d*' + this.addScriptFileExtension);
        return pattern.test(script.getIdentifier());
      });


      let numScripts;
      numScripts = filteredScripts.length === 0 ? '' : filteredScripts.length;
      this.currentFile = scriptManager.createScript(this.addScriptFileName + numScripts + this.addScriptFileExtension, 'JS', code);
      this.currentFileName = this.currentFile.getIdentifier();
    } else {
      let modelManager = this.businessNetwork.getModelManager();
      let existingModels = modelManager.getModelFiles();
      let filteredModels = existingModels.filter((model) => {
        let pattern = new RegExp(this.addModelFileName + '\\d*' + this.addModelFileExtension);
        return pattern.test(model.getName());
      });


      let numModels = filteredModels.length === 0 ? '' : filteredModels.length;

      let code =
        `/**
 * New model file
 */

namespace ${this.addModelNamespace + numModels}`;

      this.currentFile = new ModelFile(modelManager, code, this.addModelFileName + numModels + this.addModelFileExtension);
      this.currentFileName = this.currentFile.getFileName();
    }
  }
}
