# Runtime Verification
The runtime should be verified against the following platforms:
 - Ubuntu 14:04 & Ubuntu 16:04
 - MacOS 10
 - (_Windows 10 is not yet ready_)

A fresh virtualised image should be used where possible, to ensure that the process will be as that of a new user with a fresh machine. This does however preclude this process from detecting issues where a user already has some components (dependancies etc) pre-installed and may cause a conflict with script files provided.

## CLI
Cmd line Installation Verification  (Mac OS X and Ubuntu). These test should be run following the instructions in the web pages.
_These should be run using the unstable releases of the code to validate what is going to be released is good_

This short output shows how to install and update the package.json of the getting started application to use the unstable versions and uses the Digital Property sample application as an indicative test of _unstable_. You 

```bash
$ npm install -g composer-cli@unstable
<output redacted>
$ composer --version
composer-cli                   v0.10.0-20170720064757
composer-admin                 v0.10.0-20170720064757
composer-client                v0.10.0-20170720064757
composer-common                v0.10.0-20170720064757
composer-runtime-hlf           v0.10.0-20170720064757
composer-connector-hlf         v0.10.0-20170720064757

# Execute the following 4 steps, to stand up a runtime Fabric 
$ mkdir fabric-tools && cd fabric-tools
$ curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip
$./startFabric.sh # will remove containers that exist previously including dev-* containers
$./createComposerProfile.sh
$ cd  # ie $HOME
#
$ git clone https://github.com/hyperledger/composer-sample-applications.git
<output redacted>
$ cd composer-sample-applications/packages/digitalproperty-app
$ sed -i.ORIG 's/\("composer-.*".*\):.*"/\1:"unstable"/g' package.json
$ npm install --tag=unstable
$ npm run deployNetwork  # will/should install a docker container suffixed with this 'unstable' composer release
$ docker ps -a # check the container version after the business network name eg digitalproperty-network
$ npm test # check the assets are bootstrapped / updated.
```

## New Feature Testing

All new features added for the release, which will be named in the release notes outline, should be proven on the unstable build. At this point some exploratory testing needs to be investigated, in an attempt to break the delivered feature and/or knowingly drive it towards a state where features could be working from invalid information.

## Exploratory Testing

Different users will attempt different things, be starting from different points with different skill level. Options to consider

 - Add a new asset type to a model and a new transaction, or write a new model from a different business domain
 - Review the questions found in the week on StackOverflow & Rocket.Chat - how did the user get to the position they are in?
 - What new PRs have gone in this week - how could they deployed and used in the existing networks?
