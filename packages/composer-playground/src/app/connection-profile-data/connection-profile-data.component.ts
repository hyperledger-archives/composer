import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminService } from '../services/admin.service';

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
    this.connectionProfileData = connectionProfile;
    console.log('Profile Loaded',this.connectionProfileData);
  }

  constructor(private adminService:AdminService) {
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

  deleteProfile(connectionProfileData){
    let adminConnection = this.adminService.getAdminConnection();
    adminConnection.deleteProfile(connectionProfileData.name);
  }


}

