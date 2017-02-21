import { Component, ViewChild, EventEmitter, Input, Output } from '@angular/core';

import { NotificationService } from '../notification.service';

@Component({
  selector: 'error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent {

  private error: string = null;
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

  displayAndWait(error: string): Promise<any> {
    this.error = error;
    if (!this.showing) {
      this.showing = true;
      this.notificationService.modalPromise = this.notificationService.modalPromise.then(() => {
        return new Promise((resolve, reject) => {
          if (!this.error) {
            return resolve();
          }
          let subs = [
            this.hidden$.subscribe(() => {
              this.error = null;
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
      this.error = null;
      this.showing = false;
      this.modal.hide();
      resolve();
    });
  }

}
