import {Component, Input, Output, EventEmitter} from '@angular/core';
import {
  FormGroup, FormControl, Validators, FormBuilder
}
  from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConnectionProfileService} from '../services/connectionprofile.service'
import {DeleteConnectionProfileComponent} from '../delete-connection-profile/delete-connection-profile.component.ts';
import {saveAs} from 'file-saver';

@Component({
  selector: 'connection-profile-data',
  templateUrl: './connection-profile-data.component.html',
  styleUrls: [
    './connection-profile-data.component.scss'.toString()
  ]
})

export class ConnectionProfileDataComponent {

  private connectionProfileData = null;
  private expandedSection = ["Basic Configuration"];
  private showExpand:boolean = true;

  @Input() set connectionProfile(connectionProfile: any) {
    this.editing = false;
    this.connectionProfileData = connectionProfile;
    if(this.connectionProfileData && this.connectionProfileData.name.startsWith('New Connection Profile')) {
      this.startEditing();
    }
    console.log('Profile Loaded',this.connectionProfileData);
  }

  @Output() profileUpdated = new EventEmitter();

  private form: FormGroup;

  private editing = false;

  constructor(private fb: FormBuilder,
              private connectionProfileService: ConnectionProfileService,
              private modalService: NgbModal) {
  }

  expandSection(sectionToExpand) {
    if(sectionToExpand === 'All'){
      if(this.expandedSection.length === 3){
        this.expandedSection = [];
      }
      else{
        this.expandedSection = ['Basic Configuration','Security Settings','Advanced'];
      }
    }
    else{
      let index = this.expandedSection.indexOf(sectionToExpand);
      if (index > -1) {
        this.expandedSection = this.expandedSection.filter(function(item){
          return item !== sectionToExpand
        });
      } else {
        this.expandedSection.push(sectionToExpand);
      }
    }

  }

  useProfile() {
    this.connectionProfileService.setCurrentConnectionProfile(this.connectionProfileData.name);
  }

  startEditing() {
    this.form = this.fb.group({
      "name": [
        this.connectionProfileData ? this.connectionProfileData.name : '',
        [Validators.required]
      ],

      "description": [
        this.connectionProfileData ? this.connectionProfileData.profile.description : ''
      ],

      "type": [
        this.connectionProfileData ? this.connectionProfileData.type : 'hlf'
      ],

      "peerURL": [
        this.connectionProfileData ? this.connectionProfileData.profile.peerURL : 'grpc://localhost:7051',
        [Validators.required]
      ],

      "membershipServicesURL": [
        this.connectionProfileData ? this.connectionProfileData.profile.membershipServicesURL : 'grpc://localhost:7054',
        [Validators.required]
      ],

      "eventHubURL": [
        this.connectionProfileData ? this.connectionProfileData.profile.eventHubURL : 'grpc://localhost:7053',
        [Validators.required]
      ],

      "keyValStore": [
        this.connectionProfileData ? this.connectionProfileData.profile.keyValStore : '/tmp/keyValStore',
        [Validators.required]
      ],

      // Is required and must be a number
      "deployWaitTime": [
        this.connectionProfileData ? this.connectionProfileData.profile.deployWaitTime : 300,
        [
          Validators.required,
          Validators.pattern('[0-9]+')
        ]
      ],

      // Is required and must be a number
      "invokeWaitTime": [
        this.connectionProfileData ? this.connectionProfileData.profile.invokeWaitTime : 30,
        [
          Validators.required,
          Validators.pattern('[0-9]+')
        ]
      ],

      "certificate": [
        this.connectionProfileData ? this.connectionProfileData.profile.certificate : ''
      ],

      "certificatePath": [
        this.connectionProfileData ? this.connectionProfileData.profile.certificatePath : ''
      ]
    });

    this.form.valueChanges.subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now

    this.editing = true;
  }

  onValueChanged(data?: any) {
    if (!this.form) { return; }
    const form = this.form;

    for (const field in this.formErrors) {
      // clear previous error message (if any)
      this.formErrors[field] = '';
      const control = form.get(field);

      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        for (const key in control.errors) {
          this.formErrors[field] += messages[key] + ' ';
        }
      }
    }
  }

  private formErrors = {
    'name':'',
    'peerURL':'',
    'membershipServicesURL':'',
    'eventHubURL':'',
    'keyValStore':'',
    'deployWaitTime': '',
    'invokeWaitTime':''
  };

  validationMessages = {
    'name':{
      'required': 'A connection profile name is required.',
    },
    'peerURL':{
      'required': 'A Peer URL is required.',
    },
    'membershipServicesURL':{
      'required': 'A Membership Services URL is required.',
    },
    'eventHubURL':{
      'required': 'An Event Hub URL is required.',
    },
    'keyValStore':{
      'required': 'A Key Value Store Directory Path is required.',
    },
    'deployWaitTime': {
      'required': 'A Deploy Wait Time (seconds) is required.',
      'pattern': 'The Deploy Wait Time (seconds) must be an integer.'
    },
    'invokeWaitTime':{
      'required': 'An Invoke Wait Time (seconds) is required.',
      'pattern': 'The Invoke Wait Time (seconds) must be an integer.'
    }

  };



  onSubmit() {
    let connectionProfile = this.form.value;
    // Need to set this as user doesn't input profile type
    connectionProfile.type = this.connectionProfileData.profile.type;
    this.connectionProfileService.createProfile(connectionProfile.name, connectionProfile).then(() => {
      this.editing = false;

      // Need to set the profile back to its original form
      let profileToSet = {
        name: connectionProfile.name,
        profile: connectionProfile,
        default: false
      };




      return this.connectionProfileService.getAllProfiles().then((connectionProfiles) => {
        let profiles = Object.keys(connectionProfiles).sort();
        profiles.forEach((profile) => {
          let connectionProfile = connectionProfiles[profile];
          if(connectionProfile.name === this.connectionProfileData.name){
            return this.connectionProfileService.deleteProfile(this.connectionProfileData.name);
          }
        })


      }).then(()=>{
        this.connectionProfileData = profileToSet;
        this.profileUpdated.emit(true);
      })

    });
  }

  stopEditing(){
    this.editing = false;
  }

  deleteProfile(){
    this.modalService.open(DeleteConnectionProfileComponent).result
    .then((result) => {
      if(result){
        this.connectionProfileService.deleteProfile(this.connectionProfileData.name)
        this.profileUpdated.emit(true);
      }
    })
    .catch((closed)=>{});
  }


  exportProfile(){
    console.log('Exported profile')
    let profileData = JSON.stringify(this.connectionProfileData.profile,null, 4);

    let file = new File([profileData],'connection.json',{type: 'application/json'});
    saveAs(file);
  }
}

