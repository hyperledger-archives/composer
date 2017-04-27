import { Component, OnInit } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AddConnectionProfileComponent } from '../add-connection-profile/add-connection-profile.component.ts';
import { ConnectionProfileService } from '../services/connectionprofile.service';

@Component({
  selector: 'connection-profile',
  templateUrl: './connection-profile.component.html',
  styleUrls: [
    './connection-profile.component.scss'.toString()
  ]
})
export class ConnectionProfileComponent implements OnInit {

  private warningVisible: boolean = false; //NEED TO HAVE THIS AUTOMATICALLY CHANGE DEPENDING ON IF WE'RE IN WEB BROWSER MODE OR NOT

  private connectionProfiles: any;
  private currentConnectionProfile;
  private previousConnectionProfile;
  private activeProfile;

  constructor(private connectionProfileService: ConnectionProfileService,
              private modalService: NgbModal) {

              }

  ngOnInit(): any {
    this.activeProfile = this.connectionProfileService.getCurrentConnectionProfile();
    return this.updateConnectionProfiles().then(() => {
      for(let profile in this.connectionProfiles){
        if(this.connectionProfiles[profile].name === this.activeProfile){
          this.setCurrentProfile(this.connectionProfiles[profile]);
          break;
        }
      }
    })
  }

  setCurrentProfile(connectionProfile) {
    this.previousConnectionProfile = this.currentConnectionProfile;
    this.currentConnectionProfile = connectionProfile;
    return this.updateConnectionProfiles();
  }


  hideWarning(){
    this.warningVisible = false;
  }

  openAddProfileModal() {
    this.modalService.open(AddConnectionProfileComponent).result
    .then((result) => {
      this.setCurrentProfile(result);
    })
    .catch((closed) => {});
  }

  updateConnectionProfiles(): Promise<any> {
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
        if(this.currentConnectionProfile === null){
          this.currentConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        }
      });
  }

  profileUpdated(event){
    // If form is cancelled, we want to switch to the previous file selected
    if(!event){
      console.log('previous', this.previousConnectionProfile);
      this.currentConnectionProfile = this.previousConnectionProfile;
      console.log('current', this.currentConnectionProfile);
    }

    return this.updateConnectionProfiles();
  }
}
