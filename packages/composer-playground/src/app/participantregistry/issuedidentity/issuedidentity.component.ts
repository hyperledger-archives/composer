import { Component, ViewChild, EventEmitter, Input, Output } from '@angular/core';

import { AdminService } from '../../admin.service';
import { ConnectionProfileService } from '../../connectionprofile.service';
import { NotificationService } from '../../notification.service';
import { IdentityService } from '../../identity.service';

@Component({
  selector: 'issued-identity',
  templateUrl: './issuedidentity.component.html',
  styleUrls: ['./issuedidentity.component.css']
})
export class IssuedIdentityComponent {

  private userID: string = null;
  private userSecret: string = null;
  private invitationURL: string = null;
  private currentUserID: string = null;
  private showing: boolean = false;

  @ViewChild('modal') private modal;

  @Output('onHidden') private hidden$ = new EventEmitter();

  constructor(
    private notificationService: NotificationService,
    private adminService: AdminService,
    private connectionProfileService: ConnectionProfileService,
    private identityService: IdentityService
  ) {

  }

  private onHidden() {
    this.hidden$.emit();
  }

  displayAndWait(userID: string, userSecret: string, invitationURL: string): Promise<any> {
    this.userID = userID;
    this.userSecret = userSecret;
    this.invitationURL = invitationURL;
    this.identityService.getCurrentIdentity()
      .then((result) => {
        this.currentUserID = result;
      });
    if (!this.showing) {
      this.showing = true;
      this.notificationService.modalPromise = this.notificationService.modalPromise.then(() => {
        return new Promise((resolve, reject) => {
          let subs = [
            this.hidden$.subscribe(() => {
              this.userID = this.userSecret = null;
              this.showing = false;
              resolve();
              subs.forEach((sub) => { sub.unsubscribe(); });
            })
          ];
          this.modal.show();
        });
      });
    }
    return this.notificationService.modalPromise;
  }

  close() {
    return new Promise((resolve, reject) => {
      this.userID = this.userSecret = null;
      this.showing = false;
      this.modal.hide();
      resolve();
    });
  }

}
