import { Component, ViewChild, EventEmitter, Input, Output } from '@angular/core';

import { NotificationService } from '../notification.service';

@Component({
  selector: 'busy',
  templateUrl: './busy.component.html',
  styleUrls: ['./busy.component.css']
})
export class BusyComponent {

  private status: string = null;
  private showing: boolean = false;

  @ViewChild('modal') private modal;

  @Output('onHidden') private hidden$ = new EventEmitter();

  constructor(
    private notificationService: NotificationService
  ) {

  }

  private onHidden() {
    this.hidden$.emit();
  }

  displayAndWait(status: string): Promise<any> {
    this.status = status;
    if (!this.showing) {
      this.showing = true;
      this.notificationService.modalPromise = this.notificationService.modalPromise.then(() => {
        return new Promise((resolve, reject) => {
          if (!this.status) {
            return resolve();
          }
          let subs = [
            this.hidden$.subscribe(() => {
              this.status = null;
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
      this.status = null;
      this.showing = false;
      this.modal.hide();
      resolve();
    });
  }

}
