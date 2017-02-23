import { Component, OnInit } from '@angular/core';
import { AboutService } from './../services/about.service';


@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'.toString()]
})

export class AboutComponent implements OnInit {

  common;
  admin;
  client;
  playground = this.common = this.client = this.admin = {name: '', version: ''};

  constructor(private aboutService: AboutService) {}

  ngOnInit() {
    this.aboutService.getVersions()
      .then((modules) => {
        this.playground = modules.playground;
        this.common = modules.common;
        this.client = modules.client;
        this.admin = modules.admin;
      });
  }
}
