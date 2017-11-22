export class Config {
  public webonly: boolean = false;
  public title: string = '';
  public banner: Array<string> = ['', ''];
  public links: object = {
    docs: <string> '',
    tutorial: <string> '',
    community: <string> '',
    github: <string> '',
    install: <string> ''
  };
  public analyticsID: string = null;

  setValuesFromObject(values: object): void {
    this.overwriteConfigWithUserConfig(this, values);
  }

  setToDefault(): void {
    this.webonly = false;
    this.title = 'Hyperledger Composer';
    this.banner = ['Hyperledger', 'Composer Playground'];
    this.links = {
      docs: <string> 'https://hyperledger.github.io/composer/introduction/introduction.html',
      tutorial: <string> 'https://hyperledger.github.io/composer/tutorials/playground-tutorial.html',
      community: <string> 'https://hyperledger.github.io/composer/support/support-index.html',
      github: <string> 'https://github.com/hyperledger/composer',
      install: <string> 'https://hyperledger.github.io/composer/installing/installing-index.html'
    };
    this.analyticsID = null;
  }

  private overwriteConfigWithUserConfig(baseConfig: object, userConfig: object) {
    for (let key in baseConfig) {
      if (baseConfig.hasOwnProperty(key) && userConfig.hasOwnProperty(key)) {
        if (baseConfig[key] instanceof Object && userConfig[key] instanceof Object) {
          baseConfig[key] = this.overwriteConfigWithUserConfig(baseConfig[key], userConfig[key]);
        } else {
          baseConfig[key] = userConfig[key];
        }
      }
    }
    return baseConfig;
  }
}
