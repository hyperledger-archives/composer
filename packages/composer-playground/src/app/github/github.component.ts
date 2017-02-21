import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as socketIOClient from 'socket.io-client'

import {SampleBusinessNetworkService} from '../services/samplebusinessnetwork.service';

@Component({
  selector: 'github',
  template: ``,
})

export class GithubComponent implements OnInit {

  private socket;
  private connected: boolean = false;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private sampleBusinessNetworkService: SampleBusinessNetworkService) {

    const connectorServerURL = 'http://localhost:15699';

    this.connected = false;
    if (ENV && ENV !== 'development') {
      this.socket = socketIOClient(window.location.origin);
    }
    else {
      this.socket = socketIOClient(connectorServerURL);
    }

    this.socket.on('connect', () => {
      this.connected = true;
    });
    this.socket.on('disconnect', () => {
      this.connected = false;
    });
  }

  ngOnInit() {
    this.route
      .queryParams
      .subscribe((queryParams) => {
        let code = queryParams['code'];
        this.exchangeCodeForAccessToken(code)
          .then((token)=> {
            this.sampleBusinessNetworkService.setUpGithub(token.access_token);
            this.sampleBusinessNetworkService.OPEN_SAMPLE = true;
            return this.router.navigate(['/editor']);
          })
      });
  }

  exchangeCodeForAccessToken(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket.emit('/api/getGitHubAccessToken', code, (error, token) => {
        if (error) {
          return reject(error);
        }
        resolve(token);
      });
    });
  }

}
