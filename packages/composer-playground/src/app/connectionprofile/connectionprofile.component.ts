import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AdminService } from '../admin.service';
import { ClientService } from '../client.service';

import { AclFile, BusinessNetworkDefinition, ModelFile } from 'composer-common';


@Component({
  selector: 'connection-profile',
  templateUrl: './connectionprofile.component.html',
  styleUrls: [
    './connectionprofile.component.scss'.toString()
  ]
})
export class ConnectionProfileComponent implements OnInit {

  private profiles: any = [];
  private currentProfile: any = null;
  // private profileDetails: string = null;
  private changingCurrentProfile: boolean = false;

  private warningVisible: boolean = true;

  constructor(private adminService: AdminService,
              private clientService: ClientService,
              private modalService: NgbModal,
              private route: ActivatedRoute) {

              }

  ngOnInit(): void {
    console.log('Loaded ConnectionProfileComponent');

    this.updateProfiles();
    console.log('updated profiles');
    this.currentProfile = this.profiles[0];
    console.log('set currentprofile')
    this.setCurrentProfile(this.currentProfile);
  }

  private updateProfiles(): void {
    let newProfiles = [];

    // To be edited once we add the ability to import new profiles
    newProfiles.push({
      id: 'WebBrowser',
      displayID: 'Web Browser',
      details: "The Web Browser profile provides a simulated blockchain (running in browser memory) that can be used to test out Business Network Definitions before deploying them to a real Hyperledger Fabric"
    });

    this.profiles = newProfiles;

  }

  private setCurrentProfile(profile) {
    this.changingCurrentProfile = true;
    try {

      this.currentProfile = profile;
      // this.profileDetails = this.getProfileDetails();
    } finally {
      this.changingCurrentProfile = false;
    }
  }

  private hideWarning(){
    this.warningVisible = false;
  }
    // private getProfileDetails() {
    //   // To be edited once we add the ability to import new profiles
    //   return "web browser details";
    // }

}
