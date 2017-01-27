import { Component, ViewChild, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AdminService } from '../admin.service';
import { ClientService } from '../client.service';
import { NotificationService } from '../notification.service';
import { SampleService } from '../sample.service';

@Component({
  selector: 'sample',
  templateUrl: './sample.component.html',
  styleUrls: ['./sample.component.css']
})
export class SampleComponent implements OnInit {

  private deployInProgress: boolean = false;
  private sampleNames: string[] = [];
  private sampleName: string = null;
  private sampleDescription: string = null;

  @ViewChild('modal') private modal;

  @Output('onDeployed') private deployed$ = new EventEmitter();
  @Output('onHidden') private hidden$ = new EventEmitter();
  @Output('onError') private error$ = new EventEmitter();

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private clientService: ClientService,
    private notificationService: NotificationService,
    private sampleService: SampleService) {

  }

  ngOnInit(): Promise<any> {
    return this.adminService.ensureConnected()
      .then(() => {
        return this.clientService.ensureConnected();
      })
      .then(() => {
        this.sampleNames = this.sampleService.getSampleNames();
        if (this.sampleNames.length) {
          this.sampleName = this.sampleNames[0];
          this.sampleDescription = this.sampleService.getSampleDescription(this.sampleName);
        }
      });
  }

  private onShow() {

  }

  private onHidden() {
    this.hidden$.emit();
  }

  private deploy() {
    this.deployInProgress = true;
    return this.sampleService.deploySample(this.sampleName)
      .then(() => {
        this.deployed$.emit();
        this.deployInProgress = false;
      })
      .catch((error) => {
        this.error$.emit(error);
        this.deployInProgress = false;
      })
  }

  displayAndWait(): Promise<boolean> {
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
          if (!this.deployInProgress) {
            resolve(false);
            subs.forEach((sub) => { sub.unsubscribe(); });
          }
        }),
        this.deployed$.subscribe(() => {
          resolve(true);
          subs.forEach((sub) => { sub.unsubscribe(); });
        }),
        this.error$.subscribe((error) => {
          resolve(false);
          subs.forEach((sub) => { sub.unsubscribe(); });
        })
      ];
    });
  }

  onSampleNameChanged() {
    this.sampleDescription = this.sampleService.getSampleDescription(this.sampleName);
  }

}
