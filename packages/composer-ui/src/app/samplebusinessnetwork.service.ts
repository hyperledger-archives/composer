import {Injectable} from '@angular/core';

import * as Octokat from 'octokat'
import * as socketIOClient from 'socket.io-client';

import {AdminService} from './admin.service';
import {ClientService} from './client.service';

import {BusinessNetworkDefinition} from 'composer-admin';
import {AclFile} from 'composer-common';


@Injectable()
export class SampleBusinessNetworkService {

  private octo;
  private socket;
  private connected: boolean = false;

  constructor(private adminService: AdminService,
              private clientService: ClientService) {

    //TODO: need to put in OAuth info here
    this.octo = new Octokat();

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

  /**
   * Ensure that we are connected to the connector server.
   * @return {Promise} A promise that will be resolved when we
   * are connected to the connector server, or rejected with an
   * error.
   */
  ensureConnected() {
    if (this.connected) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.socket.once('connect', () => {
        resolve();
      });
    });
  }

  getNpmInfo(name) {
    return new Promise((resolve, reject) => {
      this.socket.emit('/api/getNpmInfo', name, (error, info) => {
        if (error) {
          return reject(error);
        }

        resolve(info);
      });
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
        throw error
      });
  }

  public getModelsInfo(owner: string, repository: string): Promise<any> {
    let repo = this.octo.repos(owner, repository);

    return repo.contents('packages').fetch()
      .then((result) => {
        return this.getModelsInfoMonoRepo(owner, repository, result);
      })
      .catch((error) => {
        if (error.status == '404') {
          return this.getSampleNetworkInfo(owner, repository, '')
            .then((info) => {
              let infoArray = [];
              infoArray.push(info);
            })
        } else {
          throw error;
        }
      });
  }

  public getSampleNetworkInfo(owner: string, repository: string, path: string): Promise<any> {
    let repo = this.octo.repos(owner, repository);

    return repo.contents(path + 'package.json').read()
      .then((info) => {
        let contentInfo = JSON.parse(info);
        //needed to know where to look in the repository for the files
        contentInfo.composerPath = path;
        return contentInfo;
      })
      .catch((error) => {
        throw error
      });
  }

  public getDependencyModel(owner: string, repository: string, dependencyName: string): Promise<any> {
    let repo = this.octo.repos(owner, repository);
    return repo.contents('packages').fetch()
    //in this case we have a mono-repo so need to find the path to the model
      .then((result) => {
        let foundItem = result.items.find((item) => {
          return item.name.toLowerCase() === dependencyName;
        });

        return this.getModel(owner, repository, 'packages/' + foundItem.name + '/');
      })
      .catch((error) => {
        // we don't have a mono-repo so just get the model
        if (error.status == '404') {
          return this.getModel(owner, repository, '');
        } else {
          throw error;
        }
      });
  }

  public getModel(owner: string, repository: string, path: string): Promise<any> {
    let repo = this.octo.repos(owner, repository);
    return repo.contents(path + 'models').fetch()
      .then((models) => {
        let modelFilePromises: Promise<any>[] = [];
        models.items.forEach((model) => {
          modelFilePromises.push(repo.contents(model.path).read());
        });
        return Promise.all(modelFilePromises);
      })
      .then((modelFiles) => {
        return modelFiles;
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
        results.forEach((npmInfo)=> {
          //TODO: remove hacky stuff to make work with url
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
          .then((results) => {
            //put all models into one array for easier processing later
            let allModels = [];
            results.forEach((models) => {
              Array.prototype.push.apply(allModels, models);
            });

            return allModels;
          })
      })
      //TODO: do something more sensible with this
      .catch((error) => {
        throw error
      });
  }

  private getScripts(owner: string, repository: string, path: string): Promise<any> {
    let repo = this.octo.repos(owner, repository);

    let scriptFileData = [];
    return repo.contents(path + 'lib').fetch()
      .then((scripts) => {
        let scriptFilePromises: Promise<any>[] = [];
        scripts.items.forEach((script) => {
          scriptFileData.push({name: script.name});
          scriptFilePromises.push(repo.contents(script.path).read());
        });
        return Promise.all(scriptFilePromises);
      })
      .then((scriptFiles) => {
        for (let i = 0; i < scriptFiles.length; i++) {
          scriptFileData[i].data = scriptFiles[i];
        }
        return scriptFileData;
      })
      .catch((error) => {
        //don't need scripts files to be valid
        if (error.status == '404') {
          return Promise.resolve();
        }
        throw error;
      });
  }

  private getAcls(owner: string, repository: string, path: string): Promise<any> {
    let repo = this.octo.repos(owner, repository);

    return repo.contents(path + 'permissions.acl').read()
      .then((permissions) => {
        let aclFileData = {
          name: 'permissions.acl',
          data: permissions
        };
        return aclFileData;
      })
      .catch((error) => {
        //don't need to have a permissions file to be valid
        if (error.status == '404') {
          return Promise.resolve();
        }
        throw error
      });
  }

  public deploySample(owner: string, repository: string, chosenNetwork: any): Promise < any > {
    this.adminService.busyStatus$.next('Deploying sample business network ...');

    let sampleNetworkPromises: Promise<any>[] = [];
    let path = chosenNetwork.composerPath;

    if (!chosenNetwork.dependencies) {
      sampleNetworkPromises.push(this.getModel(owner, repository, path));
    }
    else {
      sampleNetworkPromises.push(this.getSampleNetworkDependencies(chosenNetwork.dependencies))
    }
    sampleNetworkPromises.push(this.getScripts(owner, repository, path));
    sampleNetworkPromises.push(this.getAcls(owner, repository, path));

    return Promise.all(sampleNetworkPromises)
      .then((results) => {

        let models = results[0];
        let scripts = results[1];
        let acls = results[2];

        let businessNetworkDefinition = new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network');
        let modelManager = businessNetworkDefinition.getModelManager();
        models.forEach((model) => {
          modelManager.addModelFile(model);
        });

        let scriptManager = businessNetworkDefinition.getScriptManager();
        scripts.forEach((script) => {
          let thisScript = scriptManager.createScript(script.name, 'JS', script.data);
          scriptManager.addScript(thisScript);
        });

        if (acls) {
          let aclManager = businessNetworkDefinition.getAclManager();
          let aclFile = new AclFile(acls.name, modelManager, acls.data);
          aclManager.setAclFile(aclFile);
        }
        return this.adminService.update(businessNetworkDefinition);
      })
      .then(() => {
        return this.clientService.refresh();
      })
      .then(() => {
        return this.clientService.reset();
      })
      .catch((error) => {
        throw error;
      });
  }
}
