import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Http }    from '@angular/http';

import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';

@Component({
    selector: 'github',
    template: ``,
})

export class GithubComponent implements OnInit {

    private connected: boolean = false;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private http: Http,
                private sampleBusinessNetworkService: SampleBusinessNetworkService) {
    }

    ngOnInit() {
        this.route
        .queryParams
        .subscribe((queryParams) => {
            let code = queryParams['code'];
            this.exchangeCodeForAccessToken(code)
            .then((token) => {
                this.sampleBusinessNetworkService.setUpGithub(token.access_token);
                this.sampleBusinessNetworkService.OPEN_SAMPLE = true;
                return this.router.navigate(['/editor']);
            });
        });
    }

    exchangeCodeForAccessToken(code: string): Promise<any> {
        return this.http.get(PLAYGROUND_API + '/api/getGitHubAccessToken/' + code)
        .toPromise()
        .then((response) => {
            return response.json();
        })
        .catch((error) => {
            throw error;
        });
    }
}
