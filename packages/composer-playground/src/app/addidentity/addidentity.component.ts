import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {ConnectionProfileService} from '../services/connectionprofile.service';
import {WalletService} from '../wallet.service';

@Component({
  selector: 'add-identity-modal',
  templateUrl: './addidentity.component.html',
  styleUrls: ['./addidentity.component.scss'.toString()]
})

export class AddIdentityComponent {

  private userID: string = null;
  private userSecret: string = null;
  private addInProgress: boolean = false;

  @Input()
  public connectionProfileOverride: string = null;


  constructor(private connectionProfileService: ConnectionProfileService,
              private walletService: WalletService,
              private activeModal: NgbActiveModal) {
  }

  private add() {
    this.addInProgress = true;
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
        this.addInProgress = false;
        this.activeModal.close();
      })
      .catch((error) => {
        this.activeModal.dismiss(error);
        this.addInProgress = false;
      })
  }
}
