import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BusinessNetworkDefinition, ModelFile } from 'composer-common';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'add-file-model',
  templateUrl: './add-file.component.html',
  styleUrls: ['./add-file.component.scss'.toString()]
})
export class AddFileComponent implements OnInit {

  @Input() businessNetwork: BusinessNetworkDefinition;

  private currentFile = null;
  private currentFileName = null;
  private fileType = '';
  private newFile = false;

  private expandInput: boolean = false;

  private maxFileSize: number = 5242880;
  private supportedFileTypes: string[] = ['.js', '.cto'];

  private addModelNamespace: string = 'org.acme.model';
  private addModelFileName: string = 'lib/org.acme.model.cto';
  private addScriptFileName: string = 'lib/script.js';

  private error = null;
  constructor(private alertService: AlertService,
              public activeModal: NgbActiveModal) {

  }

  ngOnInit() {
  }

  private fileDetected(count) {
    this.expandInput = true;
  }

  private fileLeft(count) {
    if (count === 0) {

    }
    this.expandInput = false;
  }

  private fileAccepted(file: File) {
    this.newFile = false;
    let type = file.name.substr(file.name.lastIndexOf('.') + 1);
    let fileReader = new FileReader();
    fileReader.onload = () => {
      let dataBuffer = Buffer.from(fileReader.result);
      try {
        switch (type) {
          case 'js':
            this.fileType = 'js';
            let scriptManager = this.businessNetwork.getScriptManager();
            this.currentFile = scriptManager.createScript(file.name, 'JS', dataBuffer.toString());
            this.currentFileName = this.currentFile.getIdentifier();
            break;
          case 'cto':
            this.fileType = 'cto';
            let modelManager = this.businessNetwork.getScriptManager();
            this.currentFile = new ModelFile(modelManager, dataBuffer.toString(), file.name);
            this.currentFileName = this.currentFile.getFileName();
            break;
          default:
            break;
        }
        this.expandInput = true;
      } catch (error) {
        // this.activeModal.dismiss();
        return this.fileRejected(error);
      }
    };

    fileReader.readAsArrayBuffer(file);
  }

  private fileRejected(reason: string) {
    this.alertService.errorStatus$.next(reason);
  }

  private removeFile() {
    this.expandInput = false;
    this.currentFile = null;
  }

  private changeCurrentFileType() {
    this.newFile = true;
    if (this.fileType === 'js') {
      let code =
        `/**
  * New script file
  */`;
      let scriptManager = this.businessNetwork.getScriptManager();
      this.currentFile = scriptManager.createScript(this.addScriptFileName, 'JS', code);
    } else {
      let code =
        `/**
  * New model file
  */

  namespace ${this.addModelNamespace}`;
      let modelManager = this.businessNetwork.getModelManager();
      this.currentFile = new ModelFile(modelManager, code, this.addModelFileName);
    }
  }
}
