import { Component, OnInit } from '@angular/core';

import { ClientService } from '../client.service';
import { InitializationService } from '../initialization.service';

@Component({
  selector: 'app-assetregistries',
  templateUrl: './assetregistries.component.html',
  styleUrls: ['./assetregistries.component.css']
})
export class AssetRegistriesComponent implements OnInit {

  private assetRegistries: any;

  constructor(
    private clientService: ClientService,
    private initializationService: InitializationService
  ) {

  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {
        return this.clientService.getBusinessNetworkConnection().getAllAssetRegistries()
          .then((assetRegistries) => {
            this.assetRegistries = assetRegistries.sort((a, b) => {
              return a.id.localeCompare(b.id);
            });
          });
      })
      .catch((error) => {
        this.clientService.errorStatus$.next(error);
      });
  }

}
