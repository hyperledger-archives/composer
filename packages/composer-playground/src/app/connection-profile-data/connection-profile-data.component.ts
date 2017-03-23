import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'connection-profile-data',
  templateUrl: './connection-profile-data.component.html',
  styleUrls: [
    './connection-profile-data.component.scss'.toString()
  ]
})

export class ConnectionProfileDataComponent {

  private connectionProfileData = null;

  @Input() set connectionProfile(connectionProfile: any) {
    this.connectionProfileData = connectionProfile;
    console.log('Profile Loaded',this.connectionProfileData);
  }

  constructor() {
  }

}

