import { Component, ViewChild, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import leftPad = require('left-pad');

import { ClientService } from '../../client.service';
import { ConnectionProfileService } from '../../connectionprofile.service';
import { WalletService } from '../../wallet.service';
import { NotificationService } from '../../notification.service';
import { InitializationService } from '../../initialization.service';

@Component({
  selector: 'add-asset',
  templateUrl: './addasset.component.html',
  styleUrls: ['./addasset.component.css']
})
export class AddAssetComponent implements OnInit, OnDestroy {

  private subs: any[];
  private classes: string[] = [];
  private clazz: string = null;
  private registryID: string = null;
  private data: string = null;
  private error: string = null;
  private addInProgress: boolean = false;

  @ViewChild('modal') private modal;

  @Output('onAdded') private added$ = new EventEmitter();
  @Output('onHidden') private hidden$ = new EventEmitter();
  @Output('onError') private error$ = new EventEmitter();

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientService,
    private notificationService: NotificationService,
    private initializationService: InitializationService
  ) {

  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {
        this.subs = [
          this.route.params.subscribe(params => {
            this.registryID = params['id'];
            let businessNetworkDefinition = this.clientService.getBusinessNetwork();
            let modelManager = businessNetworkDefinition.getModelManager();
            this.classes = modelManager.getAssetDeclarations().filter((classDeclaration) => {
              return !classDeclaration.isAbstract();
            }).map((classDeclaration) => {
              return classDeclaration.getFullyQualifiedName();
            });
            if (this.classes.length) {
              let idx;
              if ((idx = this.classes.indexOf(this.registryID)) === -1) {
                idx = 0;
              }
              this.clazz = this.classes[idx];
              this.onClassChanged();
            }
          })
        ];
      });
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => { sub.unsubscribe(); });
  }

  private onShow() {
    this.onClassChanged();
  }

  private onHidden() {
    this.hidden$.emit();
  }

  private onClassChanged() {
    let businessNetworkDefinition = this.clientService.getBusinessNetwork();
    let introspector = businessNetworkDefinition.getIntrospector();
    let classDeclaration = introspector.getClassDeclaration(this.clazz);
    let factory = businessNetworkDefinition.getFactory();
    let idx = Math.round(Math.random() * 9999).toString();
    idx = leftPad(idx, 4, '0');
    let id = `${classDeclaration.getIdentifierFieldName()}:${idx}`;
    let resource = factory.newInstance(classDeclaration.getModelFile().getNamespace(), classDeclaration.getName(), id, { generate: true });
    let serializer = this.clientService.getBusinessNetwork().getSerializer();
    try {
      let json = serializer.toJSON(resource);
      this.data = JSON.stringify(json, null, 2);
    } catch (e) {
      // We can't generate a sample instance for some reason.
      console.error(e);
      this.data = '';
    }
  }

  private onDataChanged() {
    try {
      let json = JSON.parse(this.data);
      let serializer = this.clientService.getBusinessNetwork().getSerializer();
      let resource = serializer.fromJSON(json);
      resource.validate();
      this.error = null;
    } catch (e) {
      this.error = e.toString();
    }
  }

  private add() {
    this.addInProgress = true;
    this.clientService.busyStatus$.next('Adding asset ...');
    return this.clientService.getBusinessNetworkConnection().getAssetRegistry(this.registryID)
      .then((registry) => {
        let json = JSON.parse(this.data);
        let serializer = this.clientService.getBusinessNetwork().getSerializer();
        let resource = serializer.fromJSON(json);
        return registry.add(resource);
      })
      .then(() => {
        this.clientService.busyStatus$.next(null);
        this.added$.emit();
        this.addInProgress = false;
      })
      .catch((error) => {
        this.clientService.busyStatus$.next(null);
        this.clientService.errorStatus$.next(error);
        this.error$.emit(error);
        this.addInProgress = false;
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
          if (!this.addInProgress) {
            resolve(false);
            subs.forEach((sub) => { sub.unsubscribe(); });
          }
        }),
        this.added$.subscribe(() => {
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

}
