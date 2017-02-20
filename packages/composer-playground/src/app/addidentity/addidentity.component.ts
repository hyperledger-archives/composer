import { Component, ViewChild, EventEmitter, Input, Output } from '@angular/core';

import { ClientService } from '../client.service';
import { ConnectionProfileService } from '../connectionprofile.service';
import { WalletService } from '../wallet.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'add-identity',
  templateUrl: './addidentity.component.html',
  styleUrls: ['./addidentity.component.css']
})
export class AddIdentityComponent {

  private userID: string = null;
  private userSecret: string = null;
  private addInProgress: boolean = false;
  private connectionProfileOverride: string = null;

  @ViewChild('modal') private modal;

  @Output('onAdded') private added$ = new EventEmitter();
  @Output('onHidden') private hidden$ = new EventEmitter();
  @Output('onError') private error$ = new EventEmitter();

  constructor(
    private clientService: ClientService,
    private connectionProfileService: ConnectionProfileService,
    private walletService: WalletService,
    private notificationService: NotificationService
  ) {

  }

  private onShow() {
    this.userID = null;
    this.userSecret = null;
  }

  private onHidden() {
    this.hidden$.emit();
  }

  private add() {
    this.addInProgress = true;
    this.clientService.busyStatus$.next('Adding identity ...');
    let connectionProfile;
    if (this.connectionProfileOverride) {
      connectionProfile = this.connectionProfileOverride;
    } else {
      connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
    }
    let wallet = this.walletService.getWallet(connectionProfile);
    return wallet.contains(this.userID)
      .then((contains) => {
        if (contains) {
          return wallet.update(this.userID, this.userSecret)
        } else {
          return wallet.add(this.userID, this.userSecret)
        }
      })
      .then(() => {
        this.clientService.busyStatus$.next(null);
        this.added$.emit(this.userID);
        this.addInProgress = false;
      })
      .catch((error) => {
        this.clientService.busyStatus$.next(null);
        this.clientService.errorStatus$.next(error);
        this.error$.emit(error);
        this.addInProgress = false;
      })
  }

  displayAndWait(connectionProfileOverride?: string): Promise<string> {
    this.connectionProfileOverride = connectionProfileOverride;
    this.notificationService.modalPromise = this.notificationService.modalPromise.then(() => {
      return new Promise((resolve, reject) => {
        let subs = [
          this.hidden$.subscribe(() => {
            resolve();
            subs.forEach((sub) => { sub.unsubscribe(); });
          })
        ];
        this.modal.show();
      });
    });
    return new Promise((resolve, reject) => {
      let subs = [
        this.hidden$.subscribe(() => {
          if (!this.addInProgress) {
            resolve(null);
            subs.forEach((sub) => { sub.unsubscribe(); });
          }
        }),
        this.added$.subscribe(() => {
          resolve(this.userID);
          subs.forEach((sub) => { sub.unsubscribe(); });
        }),
        this.error$.subscribe((error) => {
          resolve(null);
          subs.forEach((sub) => { sub.unsubscribe(); });
        })
      ];
    });
  }

}
