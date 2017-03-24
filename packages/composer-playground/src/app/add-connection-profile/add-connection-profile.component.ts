import {Component, OnInit, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {BusinessNetworkDefinition, ModelFile} from 'composer-common';
import {AlertService} from '../services/alert.service';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'add-connection-profile',
  templateUrl: './add-connection-profile.component.html',
  styleUrls: ['./add-connection-profile.component.scss'.toString()]
})
export class AddConnectionProfileComponent {

  @Input() businessNetwork: BusinessNetworkDefinition;

  currentFile = null;
  currentFileName = null;
  version = '';
  private code: string = null;

  expandInput: boolean = false;

  maxFileSize: number = 5242880;
  supportedFileTypes: string[] = ['.json'];

  private inUseConnectionProfile: any = null;
  private connectionProfiles: any = [];
  private currentConnectionProfile: any = null;
  private changingCurrentConnectionProfile: boolean = false;

  private newConnectionProfile: any;

  private addConnectionProfileName: string = null;
  private addConnectionProfileDescription: string = null;
  private addConnectionProfilePeerURL: string = null;
  private addConnectionProfileMembershipServicesURL: string = null;
  private addConnectionProfileEventHubURL: string = null;
  private addConnectionProfileKeyValStore: string = null;
  private addConnectionProfileDeployWaitTime: number = null;
  private addConnectionProfileInvokeWaitTime: number = null;
  private addConnectionProfileCertificate: string = null;
  private addConnectionProfileCertificatePath: string = null;

  error = null;

  constructor(private alertService: AlertService,
              public activeModal: NgbActiveModal,
              private adminService: AdminService) {
  }

  removeFile() {
    this.expandInput = false;
    this.currentFile = null;
    this.currentFileName = null;
    this.version = '';
  }

  fileDetected() {
    this.expandInput = true;
  }

  fileLeft() {
    this.expandInput = false;
  }

  fileAccepted(file: File) {
    console.log('What is the file accepted?',file);
    let type = file.name.substr(file.name.lastIndexOf('.') + 1);
    this.getDataBuffer(file)
      .then((data) => {
        if(type === 'json'){
          this.expandInput = true;
          this.createProfile(file, data);
        }
        else{
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

  createProfile(file: File, dataBuffer) {

    //To be completed

    // this.fileType = 'js';
    // let scriptManager = this.businessNetwork.getScriptManager();
    // this.currentFile = scriptManager.createScript(file.name || this.addScriptFileName, 'JS', dataBuffer.toString());
    // this.currentFileName = this.currentFile.getIdentifier();
  }


  fileRejected(reason: string) {
    this.alertService.errorStatus$.next(reason);
  }

  changeCurrentFileType() {

    this.currentFile = null;
    if (this.version === 'v06') {

      this.setv06Defaults();

      this.newConnectionProfile = {
        type: 'hlf',
        membershipServicesURL: this.addConnectionProfileMembershipServicesURL,
        peerURL: this.addConnectionProfilePeerURL,
        eventHubURL: this.addConnectionProfileEventHubURL,
        keyValStore: this.addConnectionProfileKeyValStore,
        deployWaitTime: this.addConnectionProfileDeployWaitTime,
        invokeWaitTime: this.addConnectionProfileInvokeWaitTime,
        certificate: this.addConnectionProfileCertificate,
        certificatePath: this.addConnectionProfileCertificatePath
      };
      console.log('What is connectionProfile',this.newConnectionProfile);

    }
    else if(this.version === 'v10') {
      console.log('Add v1 file');
    }
    else{
      throw new Error('Unsupported version');
    }
  }

  private addConnectionProfile(): Promise<any> {
    // Do we have a connection profile certificate?
    if (this.addConnectionProfileCertificate) {
      // That isn't just whitespace?
      if (this.addConnectionProfileCertificate.trim()) {
        let end = this.addConnectionProfileCertificate.slice(-1);
        if (end !== '\n') {
          this.addConnectionProfileCertificate += '\n';
        }
      }
    }
    let connectionProfile = {
      type: 'hlf',
      description: this.addConnectionProfileDescription,
      membershipServicesURL: this.addConnectionProfileMembershipServicesURL,
      peerURL: this.addConnectionProfilePeerURL,
      eventHubURL: this.addConnectionProfileEventHubURL,
      keyValStore: this.addConnectionProfileKeyValStore,
      deployWaitTime: this.addConnectionProfileDeployWaitTime,
      invokeWaitTime: this.addConnectionProfileInvokeWaitTime,
      certificate: this.addConnectionProfileCertificate,
      certificatePath: this.addConnectionProfileCertificatePath
    };
    return this.adminService.getAdminConnection().createProfile(this.addConnectionProfileName, connectionProfile)
      .then(() => {
        console.log('Created new profile');
        return this.updateConnectionProfiles();
      });
  }


  private setv06Defaults() {
    this.updateConnectionProfiles().then(() => {
      let connectionProfileBase = 'hlfabric';
      let connectionProfileName = connectionProfileBase;
      let counter = 1;

      while (this.connectionProfiles.some((cp) => { return cp.name === connectionProfileName; })) {
        counter++;
        connectionProfileName = connectionProfileBase + counter;
      }
      this.addConnectionProfileName = connectionProfileName;
      this.addConnectionProfileDescription = "A description"
      this.addConnectionProfilePeerURL = 'grpc://localhost:7051';
      this.addConnectionProfileMembershipServicesURL = 'grpc://localhost:7054';
      this.addConnectionProfileEventHubURL = 'grpc://localhost:7053';
      this.addConnectionProfileKeyValStore = '/tmp/keyValStore';
      this.addConnectionProfileDeployWaitTime = 5 * 60;
      this.addConnectionProfileInvokeWaitTime = 30;
      this.addConnectionProfileCertificate = null;
      this.addConnectionProfileCertificatePath = null;
    })

  }


  private updateConnectionProfiles(): Promise<any> {
    let newConnectionProfiles = [];
    return this.adminService.getAdminConnection().getAllProfiles()
      .then((connectionProfiles) => {
        let keys = Object.keys(connectionProfiles).sort();
        keys.forEach((key) => {
          let connectionProfile = connectionProfiles[key];
          newConnectionProfiles.push({
            name: key,
            profile: connectionProfile,
            default: key === '$default'
          });
        });
        this.connectionProfiles = newConnectionProfiles;
      });
  }

}
