import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

@Injectable()
export class AboutService {
    constructor(private http: Http) {
    }

    getVersions(): Promise<any> {
        return this.getModules()
        .then((modules) => {
            return {
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
        })
        .catch((e) => {
            console.log(e);
        });
    }

    private getModules(): Promise<any> {
        return this.http.get('assets/npmlist.json')
        .map((res) => res.json())
        .toPromise();
    }
}
