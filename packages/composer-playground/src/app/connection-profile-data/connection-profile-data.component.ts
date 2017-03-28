import {Component, Input, Output, EventEmitter} from '@angular/core';
import {
  FormGroup, FormControl, Validators, FormBuilder
}
  from '@angular/forms';

import {ConnectionProfileService} from '../services/connectionprofile.service'

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

  constructor(private fb: FormBuilder, private connectionProfileService: ConnectionProfileService) {
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
      "name": this.connectionProfileData ? this.connectionProfileData.name : '',
      "type": this.connectionProfileData ? this.connectionProfileData.type : 'hlf',
      "description": this.connectionProfileData ? this.connectionProfileData.profile.description : '',
      "peerURL": this.connectionProfileData ? this.connectionProfileData.profile.peerURL : 'grpc://localhost:7051',
      "membershipServicesURL": this.connectionProfileData ? this.connectionProfileData.profile.membershipServicesURL : 'grpc://localhost:7054',
      "eventHubURL": this.connectionProfileData ? this.connectionProfileData.profile.eventHubURL : 'grpc://localhost:7053',
      "keyValStore": this.connectionProfileData ? this.connectionProfileData.profile.keyValStore : '/tmp/keyValStore',
      "deployWaitTime": this.connectionProfileData ? this.connectionProfileData.profile.deployWaitTime : 300,
      "invokeWaitTime": this.connectionProfileData ? this.connectionProfileData.profile.invokeWaitTime : 30,
      "certificate": this.connectionProfileData ? this.connectionProfileData.profile.certificate : '',
      "certificatePath": this.connectionProfileData ? this.connectionProfileData.profile.certificatePath : '',
    });

    this.editing = true;
  }

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
            return this.connectionProfileService.deleteProfile(this.connectionProfileData.name)
            .then(()=>{
              console.log('Deleted profile',this.connectionProfileData.name);
            })
          }
        })


      }).then(()=>{
        this.connectionProfileData = profileToSet;
        this.profileUpdated.emit(true);
      })

    });
  }
}

