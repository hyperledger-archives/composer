import {Component, Input} from '@angular/core';
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
      "description": this.connectionProfileData ? this.connectionProfileData.profile.description : '',
      "peerUrl": this.connectionProfileData ? this.connectionProfileData.profile.peerUrl : 'grpc://localhost:7051',
      "memberUrl": this.connectionProfileData ? this.connectionProfileData.profile.membershipServicesURL : 'grpc://localhost:7054',
      "eventUrl": this.connectionProfileData ? this.connectionProfileData.profile.eventHubURL : 'grpc://localhost:7053',
      "keyValueStore": this.connectionProfileData ? this.connectionProfileData.profile.keyValueStore : '/tmp/keyValStore',
      "deployWaitTime": this.connectionProfileData ? this.connectionProfileData.profile.deployWaitTime : 300,
      "invokeWaitTime": this.connectionProfileData ? this.connectionProfileData.profile.invokeWaitTime : 30,
      "certificate": this.connectionProfileData ? this.connectionProfileData.profile.certificate : '',
      "certificatePath": this.connectionProfileData ? this.connectionProfileData.profile.certificatePath : '',
    });

    this.editing = true;
  }

  onSubmit() {
    console.log(this.form);
    let connectionProfile = this.form.value;
    this.connectionProfileService.createProfile(this.connectionProfileData.name, connectionProfile).then(() => {
      this.editing = false;
    });
  }
}

