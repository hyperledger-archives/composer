import { Component, OnInit } from '@angular/core';

import { AdminService } from '../admin.service';
import { ClientService } from '../client.service';
import { InitializationService } from '../initialization.service';

import { AclFile, BusinessNetworkDefinition, ModelFile } from 'composer-common';


@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: [
    './test.component.scss'.toString()
  ]
})
export class TestComponent implements OnInit {

  private businessNetworkDefinition: BusinessNetworkDefinition = null;

  constructor(
    private adminService: AdminService,
    private clientService: ClientService,
    private initializationService: InitializationService
  ) {

  }

  ngOnInit() {

  }
}
