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


  constructor(private connectionProfileService: ConnectionProfileService,
              private modalService: NgbModal) {

              }

  ngOnInit(): any {
    console.log('Loaded ConnectionProfileComponent');

    return this.updateConnectionProfiles().then(() => {
      console.log('Set initial profiles',this.connectionProfiles);
      this.setCurrentProfile(this.connectionProfiles[0]);
    })
  }

  private setCurrentProfile(connectionProfile) {
    this.currentConnectionProfile = connectionProfile;
    return this.updateConnectionProfiles();
    // this.profileReload = !this.profileReload;

  }


  private hideWarning(){
    this.warningVisible = false;
  }
    // private getProfileDetails() {
    //   // To be edited once we add the ability to import new profiles
    //   return "web browser details";
    // }


  private openAddProfileModal() {
    this.modalService.open(AddConnectionProfileComponent).result
    .then((result) => {
      this.currentConnectionProfile = result;
      this.updateConnectionProfiles();
    })
    .catch((closed) => {});
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
        if(this.currentConnectionProfile === null){
          this.currentConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        }
      });
  }

  profileUpdated(event){
    return this.updateConnectionProfiles();
  }

}
