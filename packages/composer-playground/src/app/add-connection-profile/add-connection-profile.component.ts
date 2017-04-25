import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {BusinessNetworkDefinition} from 'composer-common';
import {AlertService} from '../services/alert.service';
import {AdminService} from '../services/admin.service';
import {ConnectionProfileService} from '../services/connectionprofile.service';

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
  private addConnectionProfileType: string = null;
  private addConnectionProfilePeerURL: string = null;
  private addConnectionProfileMembershipServicesURL: string = null;
  private addConnectionProfileEventHubURL: string = null;
  private addConnectionProfileKeyValStore: string = null;
  private addConnectionProfileDeployWaitTime: number = null;
  private addConnectionProfileInvokeWaitTime: number = null;
  private addConnectionProfileCertificate: string = null;
  private addConnectionProfileCertificatePath: string = null;

  // V1 attributes
  private addConnectionProfileOrderers: any[] = null;
  private addConnectionProfilePeers: any[] = null;
  private addConnectionProfileCertificateAuthority: string = null;
  private addConnectionProfileChannel: string = null;
  private addConnectionProfileMspId: string = null;

  error = null;

  constructor(private alertService: AlertService,
              public activeModal: NgbActiveModal,
              private adminService: AdminService,
              private connectionProfileService: ConnectionProfileService) {
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
    let type = file.name.substr(file.name.lastIndexOf('.') + 1);
    this.getDataBuffer(file)
      .then((data) => {
        if (type === 'json') {
          this.expandInput = true;
          this.createProfile(file, data);
        }
        else {
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

  createProfile(file: File, profileBuffer) {

    // Converts buffer to string
    let profileData = JSON.parse(profileBuffer.toString());

    // Set defaults

    console.log('Profile data read in is',profileData);
    if(profileData.type === 'hlf'){
      return this.setV06Defaults().then(() => {
        this.addConnectionProfileDescription = profileData.description;
        this.addConnectionProfileType = profileData.type;
        this.addConnectionProfileMembershipServicesURL = profileData.membershipServicesURL;
        this.addConnectionProfilePeerURL = profileData.peerURL;
        this.addConnectionProfileEventHubURL = profileData.eventHubURL;
        this.addConnectionProfileKeyValStore = profileData.keyValStore;
        this.addConnectionProfileDeployWaitTime = profileData.deployWaitTime;
        this.addConnectionProfileInvokeWaitTime = profileData.invokeWaitTime;
        this.addConnectionProfileCertificate = profileData.certificate;
        this.addConnectionProfileCertificatePath = profileData.certificatePath;
        this.addConnectionProfile();
      });
    }
    else if(profileData.type === 'hlfv1'){
      return this.setV1Defaults().then(() => {
        this.addConnectionProfileDescription = profileData.description;
        this.addConnectionProfileType = profileData.type;
        this.addConnectionProfileOrderers = profileData.orderers;

        this.addConnectionProfileCertificateAuthority = profileData.ca;
        this.addConnectionProfilePeers = profileData.peers;
        this.addConnectionProfileKeyValStore = profileData.keyValStore;
        this.addConnectionProfileChannel = profileData.channel;
        this.addConnectionProfileMspId = profileData.mspID;
        this.addConnectionProfileDeployWaitTime = profileData.deployWaitTime;
        this.addConnectionProfileInvokeWaitTime = profileData.invokeWaitTime;
        this.addConnectionProfile();
      })
    }
    else{
      console.log('Couldnt read profile with type:',profileData.type);
    }

  }


  fileRejected(reason: string) {
    this.alertService.errorStatus$.next(reason);
  }

  changeCurrentFileType() {
    this.currentFile = null;

    if (this.version === 'v06' || this.addConnectionProfileType === 'hlf') {

      return this.setV06Defaults().then(() => {
        this.newConnectionProfile = {
          description: this.addConnectionProfileDescription,
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
      })

    }
    else if (this.version === 'v1') {
      console.log('Add v1 file');

      return this.setV1Defaults().then(() => {
        this.newConnectionProfile = {
          description: this.addConnectionProfileDescription,
          type: 'hlfv1',
          membershipServicesURL: this.addConnectionProfileMembershipServicesURL,
          peerURL: this.addConnectionProfilePeerURL,
          eventHubURL: this.addConnectionProfileEventHubURL,
          keyValStore: this.addConnectionProfileKeyValStore,
          deployWaitTime: this.addConnectionProfileDeployWaitTime,
          invokeWaitTime: this.addConnectionProfileInvokeWaitTime,
          certificate: this.addConnectionProfileCertificate,
          certificatePath: this.addConnectionProfileCertificatePath
        };
      })


    }
    else {
      throw new Error('Unsupported version');
    }
  }

  private addConnectionProfile(): void {
    let connectionProfile;

    if(this.version === 'v06' || this.addConnectionProfileType === 'hlf'){
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
      connectionProfile = {
        description: this.addConnectionProfileDescription,
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
    }
    else if(this.version === 'v1' || this.addConnectionProfileType === 'hlfv1'){
      connectionProfile = {
        description: this.addConnectionProfileDescription,
        type: 'hlfv1',
        orderers: this.addConnectionProfileOrderers,
        ca: this.addConnectionProfileCertificateAuthority,
        peers: this.addConnectionProfilePeers,
        keyValStore: this.addConnectionProfileKeyValStore,
        channel: this.addConnectionProfileChannel,
        mspID: this.addConnectionProfileMspId,
        deployWaitTime: this.addConnectionProfileDeployWaitTime,
        invokeWaitTime: this.addConnectionProfileInvokeWaitTime
      };
    }
    else{
      console.log('Unknown connection profile version selected');
    }


    let completeConnectionProfile = {
      name: this.addConnectionProfileName,
      profile: connectionProfile,
      default: this.addConnectionProfileName === '$default'
    };
    console.log('Closing add modal, returning profile',completeConnectionProfile);
    this.activeModal.close(completeConnectionProfile);

  }


  private setV06Defaults(): Promise<any> {
    return this.updateConnectionProfiles().then(() => {
      let connectionProfileBase = 'New Connection Profile';
      let connectionProfileName = connectionProfileBase;
      let counter = 1;

      while (this.connectionProfiles.some((cp) => {
        return cp.name === connectionProfileName;
      })) {
        counter++;
        connectionProfileName = connectionProfileBase + counter;
      }

      this.addConnectionProfileName = connectionProfileName;
      this.addConnectionProfileDescription = 'A description for a V0.6 Profile',
      this.addConnectionProfileType = 'hlf',
      this.addConnectionProfilePeerURL = 'grpc://localhost:7051';
      this.addConnectionProfileMembershipServicesURL = 'grpc://localhost:7054';
      this.addConnectionProfileEventHubURL = 'grpc://localhost:7053';
      this.addConnectionProfileKeyValStore = '/tmp/keyValStore';
      this.addConnectionProfileDeployWaitTime = 5 * 60;
      this.addConnectionProfileInvokeWaitTime = 30;
      this.addConnectionProfileCertificate = null;
      this.addConnectionProfileCertificatePath = null;
    });

  }



  private setV1Defaults(): Promise<any> {
    console.log('Ran setV1Defaults()')
    return this.updateConnectionProfiles().then(() => {
      let connectionProfileBase = 'New Connection Profile';
      let connectionProfileName = connectionProfileBase;
      let counter = 1;

      while (this.connectionProfiles.some((cp) => {
        return cp.name === connectionProfileName;
      })) {
        counter++;
        connectionProfileName = connectionProfileBase + counter;
      }

      this.addConnectionProfileName = connectionProfileName;
      this.addConnectionProfileDescription = "A description for a V1 Profile"
      this.addConnectionProfileType = 'hlfv1',
      this.addConnectionProfileOrderers = [{
        url: 'grpcs://localhost:7050',
        cert: '',
        hostnameOverride: ''
      }];

      this.addConnectionProfileCertificateAuthority = "grpc://localhost:7054"
      this.addConnectionProfilePeers = [{
        requestURL: 'grpcs://localhost:7051',
        eventURL: 'grpcs://localhost:7053',
        cert: '',
        hostnameOverride: ''
      }]
      this.addConnectionProfileKeyValStore = '/tmp/keyValStore';
      this.addConnectionProfileChannel = 'mychannel';
      this.addConnectionProfileMspId = 'Org1MSP';
      this.addConnectionProfileDeployWaitTime = 5 * 60;
      this.addConnectionProfileInvokeWaitTime = 30;
    });

  }





  private updateConnectionProfiles(): Promise<any> {
    let newConnectionProfiles = [];
    return this.connectionProfileService.getAllProfiles()
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
