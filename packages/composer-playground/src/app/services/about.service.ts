import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BehaviorSubject, Observable } from 'rxjs/Rx';

@Injectable()
export class AboutService {
    versions = null;
    constructor(private http: Http) {
    }

    getVersions(): Promise<any> {
        if (!this.versions) {
            return this.getModules()
                .then((modules) => {
                    this.versions =  {
                        playground: {
                            name: 'playground',
                            version: modules.version
                        },
                        common: {
                            name: 'composer-common',
                            version: modules.dependencies['composer-common'].version
                        },
                        client: {
                            name: 'composer-client',
                            version: modules.dependencies['composer-client'].version,
                        },
                        admin: {
                            name: 'composer-admin',
                            version: modules.dependencies['composer-admin'].version
                        }
                    };
                    return this.versions;
                });
        } else {
            return Promise.resolve(this.versions);
        }
    }

    private getModules(): Promise<any> {
        return this.http.get('assets/npmlist.json')
        .map((res) => res.json())
        .toPromise();
    }
}
