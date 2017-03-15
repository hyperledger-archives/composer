import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from 'angular-2-local-storage';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';

@Component({
  selector: 'version-check-modal',
  templateUrl: './version-check.component.html',
  styleUrls: ['./version-check.component.scss'.toString()]
})
export class VersionCheckComponent {

  constructor(public activeModal: NgbActiveModal,
              private localStorageService: LocalStorageService,
              private router: Router) {
  }

  clearLocalStorage(){
    if(this.localStorageService.clearAll()){
      return this.router.navigateByUrl('/').then((result) => {
        if (result) {
          window.open('/','_self');
        }
        else {
          throw new Error('Failed to navigate to main page');
        }
      });
    }
    else{
      throw new Error('Failed to clear local storage');
    }
  }

}
