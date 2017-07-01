import { Injectable } from '@angular/core';
import { Http }    from '@angular/http';

import * as Octokat from 'octokat';

import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { AlertService } from './alert.service';

import { BusinessNetworkDefinition, AclFile } from 'composer-common';

@Injectable()
export class SampleBusinessNetworkService {

    public OPEN_SAMPLE: boolean = false;
    public RATE_LIMIT_MESSAGE = 'The rate limit to the GitHub API has been exceeded, to fix this problem setup OAuth as documented <a href="https://hyperledger.github.io/composer/managing/github-oauth.html" target="_blank">here</a>';
    public NO_CLIENT_ID = 'The client ID for the GitHub API has not been set, to fix this problem setup OAuth as documented <a href="https://hyperledger.github.io/composer/managing/github-oauth.html" target="_blank">here</a>';
    public CLIENT_ID = null;

    private octo;

    constructor(private adminService: AdminService,
                private clientService: ClientService,
                private alertService: AlertService,
                private http: Http) {
    }

    // horrible hack for tests
    createBusinessNetworkInstance(identifier, description, packageJson, readme) {
        return new BusinessNetworkDefinition(identifier, description, packageJson, readme);
    }

    // horrible hack for tests
    createAclFileInstance(name, modelManager, data) {
        return new AclFile(name, modelManager, data);
    }

    public isOAuthEnabled(): Promise<boolean> {
        return this.http.get(PLAYGROUND_API + '/api/isOAuthEnabled')
            .toPromise()
            .then((response) => {
                let enabled: boolean = response.json();
                // if we aren't doing oauth then we need to setup github without token
                if (!enabled) {
                    this.setUpGithub(null);
                }
                return enabled;
            })
            .catch((error) => {
                throw(error);
            });
    }

    public getGithubClientId(): Promise<string> {
        if (this.CLIENT_ID) {
            return Promise.resolve(this.CLIENT_ID);
        }

        return this.http.get(PLAYGROUND_API + '/api/getGithubClientId')
            .toPromise()
            .then((response) => {
                this.CLIENT_ID = response.json();
                return this.CLIENT_ID;
            })
            .catch((error) => {
                throw(error);
            });
    }

    getNpmInfo(name): Promise<any> {
        return this.http.get(PLAYGROUND_API + '/api/getNpmInfo/' + name)
            .toPromise()
            .then((response) => {
                return response.json();
            })
            .catch((error) => {
                throw error;
            });
    }

    public setUpGithub(accessToken: string) {
        if (accessToken) {
            this.octo = new Octokat({token: accessToken});
        } else {
            this.octo = new Octokat();
        }
    }

    public isAuthenticatedWithGitHub(): boolean {
        return this.octo ? true : false;
    }

    public getModelsInfo(owner: string, repository: string): Promise<any> {
        if (!this.octo) {
            return Promise.reject('no connection to GitHub');
        }
        let repo = this.octo.repos(owner, repository);

        return repo.contents('packages').fetch()
            .then((result) => {
                return this.getModelsInfoMonoRepo(owner, repository, result);
            })
            .catch((error) => {
                if (error.status === 404) {
                    return this.getSampleNetworkInfo(owner, repository, '')
                        .then((info) => {
                            let infoArray = [];
                            infoArray.push(info);
                        });
                } else {
                    throw error;
                }
            });
    }

    public getSampleNetworkInfo(owner: string, repository: string, path: string): Promise<any> {
        if (!this.octo) {
            return Promise.reject('no connection to GitHub');
        }

        let repo = this.octo.repos(owner, repository);

        return repo.contents(path + 'package.json').fetch()
            .then((info) => {
                let decodedString = atob(info.content);
                let contentInfo = JSON.parse(decodedString);
                // needed to know where to look in the repository for the files
                contentInfo.composerPath = path;
                return contentInfo;
            })
            .catch((error) => {
                throw error;
            });
    }

    getDependencyModel(owner: string, repository: string, dependencyName: string): Promise<any> {
        if (!this.octo) {
            return Promise.reject('no connection to GitHub');
        }

        let repo = this.octo.repos(owner, repository);
        return repo.contents('packages').fetch()
        // in this case we have a mono-repo so need to find the path to the model
            .then((result) => {
                let foundItem = result.items.find((item) => {
                    return item.name.toLowerCase() === dependencyName;
                });

                return this.getModel(owner, repository, 'packages/' + foundItem.name + '/');
            })
            .catch((error) => {
                // we don't have a mono-repo so just get the model
                if (error.status === 404) {
                    return this.getModel(owner, repository, '');
                } else {
                    throw error;
                }
            });
    }

    getModel(owner: string, repository: string, path: string): Promise<any> {
        if (!this.octo) {
            return Promise.reject('no connection to GitHub');
        }

        let repo = this.octo.repos(owner, repository);
        return repo.contents(path + 'models').fetch()
            .then((models) => {
                let modelFilePromises: Promise<any>[] = [];
                models.items.forEach((model) => {
                    modelFilePromises.push(repo.contents(model.path).fetch());
                });
                return Promise.all(modelFilePromises);
            })
            .then((modelFiles) => {

                let fileArray: string[] = [];

                modelFiles.forEach((file) => {
                    let decodedString = atob(file.content);
                    fileArray.push(decodedString);
                });

                return fileArray;
            })
            .catch((error) => {
                throw error;
            });
    }

    public getSampleNetworkDependencies(dependencies: any): Promise<any> {
        let dependencyPromises: Promise<any>[] = [];
        let dependencyNames = Object.keys(dependencies);
        dependencyNames.forEach((dependency) => {
            dependencyPromises.push(this.getNpmInfo(dependency));
        });

        return Promise.all(dependencyPromises)
            .then((results) => {
                let modelsPromises: Promise<any>[] = [];
                results.forEach((npmInfo) => {
                    // TODO: remove hacky stuff to make work with url
                    const github = 'git+https://github.com/';
                    const git = '.git';
                    let unparsed = npmInfo.repository.url;
                    //  let url = unparsed.substring(git.length, unparsed.length - git.length);
                    let sortOfParsed = unparsed.substring(github.length, unparsed.length - git.length);
                    let split = sortOfParsed.split('/');
                    let owner = split[0];
                    let repo = split[1];
                    modelsPromises.push(this.getDependencyModel(owner, repo, npmInfo.name));
                });

                return Promise.all(modelsPromises)
                    .then((result) => {
                        // put all models into one array for easier processing later
                        let allModels = [];
                        result.forEach((models) => {
                            Array.prototype.push.apply(allModels, models);
                        });

                        return allModels;
                    });
            })
            .catch((error) => {
                throw error;
            });
    }

    getScripts(owner: string, repository: string, path: string): Promise<any> {
        if (!this.octo) {
            return Promise.reject('no connection to GitHub');
        }

        let repo = this.octo.repos(owner, repository);

        return repo.contents(path + 'lib').fetch()
            .then((scripts) => {
                let scriptFilePromises: Promise<any>[] = [];
                scripts.items.forEach((script) => {
                    scriptFilePromises.push(repo.contents(script.path).fetch());
                });
                return Promise.all(scriptFilePromises);
            })
            .then((scriptFiles) => {
                let scriptFileData = [];
                scriptFiles.forEach((scriptFile) => {
                    let decodedString = atob(scriptFile.content);
                    scriptFileData.push({name: scriptFile.name, data: decodedString});
                });

                return scriptFileData;
            })
            .catch((error) => {
                // don't need scripts files to be valid
                if (error.status === 404) {
                    return Promise.resolve();
                }
                throw error;
            });
    }

    getAcls(owner: string, repository: string, path: string): Promise<any> {
        if (!this.octo) {
            return Promise.reject('no connection to GitHub');
        }

        let repo = this.octo.repos(owner, repository);

        return repo.contents(path + 'permissions.acl').fetch()
            .then((permissions) => {
                let decodedString = atob(permissions.content);
                let aclFileData = {
                    name: permissions.name,
                    data: decodedString
                };
                return aclFileData;
            })
            .catch((error) => {
                // don't need to have a permissions file to be valid
                if (error.status === 404) {
                    return Promise.resolve();
                }
                throw error;
            });
    }

    getReadme(owner: string, repository: string, path: string): Promise<any> {
        if (!this.octo) {
            return Promise.reject('no connection to GitHub');
        }

        let repo = this.octo.repos(owner, repository);

        return repo.contents(path + 'README.md').fetch()
            .then((readme) => {
                let decodedString = atob(readme.content);
                let readmeData = {
                    name: readme.name,
                    data: decodedString
                };
                return readmeData;
            })
            .catch((error) => {
                // don't need to have a readme file to be valid
                if (error.status === 404) {
                    return Promise.resolve();
                }
                throw error;
            });
    }

    public deploySample(owner: string, repository: string, chosenNetwork: any): Promise<any> {
        this.alertService.busyStatus$.next({
            title: 'Deploying business network',
            text: 'deploying ' + chosenNetwork.name
        });
        let sampleNetworkPromises: Promise<any>[] = [];
        let path = chosenNetwork.composerPath;

        if (!chosenNetwork.dependencies) {
            sampleNetworkPromises.push(this.getModel(owner, repository, path));
        } else {
            sampleNetworkPromises.push(this.getSampleNetworkDependencies(chosenNetwork.dependencies));
        }
        sampleNetworkPromises.push(this.getScripts(owner, repository, path));
        sampleNetworkPromises.push(this.getAcls(owner, repository, path));
        sampleNetworkPromises.push(this.getReadme(owner, repository, path));
        sampleNetworkPromises.push(this.getSampleNetworkInfo(owner, repository, path));

        return Promise.all(sampleNetworkPromises)
            .then((results) => {

                let models = results[0];
                let scripts = results[1];
                let acls = results[2];
                let readme = results[3];
                let packageContents = results[4];

                let businessNetworkDefinition = this.createBusinessNetworkInstance(null, null, packageContents, readme.data);
                let modelManager = businessNetworkDefinition.getModelManager();

                modelManager.addModelFiles(models);

                let scriptManager = businessNetworkDefinition.getScriptManager();
                scripts.forEach((script) => {
                    if(script.name.endsWith('.js')) {
                        let thisScript = scriptManager.createScript(script.name, 'JS', script.data);
                        scriptManager.addScript(thisScript);
                    }
                });

                if (acls) {
                    let aclManager = businessNetworkDefinition.getAclManager();
                    let aclFile = this.createAclFileInstance(acls.name, modelManager, acls.data);
                    aclManager.setAclFile(aclFile);
                }

                return this.deployBusinessNetwork(businessNetworkDefinition);
            });
    }

    public deployBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition): Promise<any> {
        return this.adminService.update(businessNetworkDefinition)
            .then(() => {
                return this.clientService.refresh();
            })
            .then(() => {
                return this.clientService.reset();
            })
            .then(() => {
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                throw error;
            });
    }

    private getModelsInfoMonoRepo(owner: string, repository: string, models: any): Promise<any> {
        let modelNames: string[] = [];
        models.items.forEach((modelContainer) => {
            modelNames.push(modelContainer.name);
        });

        let infoPromises: Promise<any>[] = [];
        modelNames.forEach((modelName) => {
            let path = 'packages/' + modelName + '/';
            infoPromises.push(this.getSampleNetworkInfo(owner, repository, path));
        });

        return Promise.all(infoPromises)
            .then((results) => {
                return results;
            })
            .catch((error) => {
                if (error.message) {
                    throw error;
                }
            });
    }

}
