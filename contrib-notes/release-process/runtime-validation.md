# Runtime Verification
The runtime should be verified against the following platforms:
 - Ubuntu 14:04 & Ubuntu 16:04
 - MacOS 10
 - (_Windows 10 is not yet ready_)

A fresh virtualised image should be used where possible, to ensure that the process will be as that of a new user with a fresh machine. This does however preclude this process from detecting issues where a user already has some components (dependancies etc) pre-installed and may cause a conflict with script files provided.

## Sample Applications (digital property app)
Cmd line Installation Verification  (Mac OS X and Ubuntu). These test should be run following the instructions in the web pages.
_These should be run using the unstable releases of the code to validate what is going to be released is good_

This short output shows how to install and update the package.json of the getting started application to use the unstable versions and uses the Digital Property sample application as an indicative test of _unstable_. You 

```bash
$ npm install -g composer-cli@unstable

# Execute the following steps, to stand up a runtime Fabric 
$ mkdir fabric-tools && cd fabric-tools
$ curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.zip
$ unzip fabric-dev-servers.zip
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

## Sample Networks
Following from testing of the digital-property-app, a similar operation should be performed targetting the composer-sample-networks repository.

```
$ git clone https://github.com/hyperledger/composer-sample-networks.git
```

Move through each of the sample networks in sequence, updating their composer package dependancies to point to the unstable version and then run the npm test.
```
$ cd composer-sample-networks/packages/myTestPackageItem
$ sed -i.ORIG 's/\("composer-.*".*\):.*"/\1:"unstable"/g' package.json
$ npm install --tag=unstable
$npm test
```
 
## Vehicle Lifecycle Demo
The composer-sample-applications repository also contains the vehicle-lifecyle demo. This should be run on a clean VM using the one line install.

From a fresh VM
 - Create a new directory, eg `mkdir git`
 - Navigate to directory and clone the composer-sample-applications `git clone https://github.com/hyperledger/composer-sample-applications.git`
 - navigate to `composer-sample-applications/packages/vehicle-lifecycle`
 - run `./build.sh`
 - install the unstable version `cat installers/hlfv1/install-unstable.sh | bash`
 -- this will take 'some' time
 - after build web browser should open with pages for each aspect

Verification Stage (basic)
 - Should be able to log into Playground
 - Should be able to use rest server to post/get
 - Node Red nodes should be shown with no errors
 - VDA screen should be shown, with all links operating
 - Dashboard should be visible, with all links working
 - Ionic App should be accessible

Verification Stage (adv)
 - Use the Ionic App to drive the vehicle lifecycle
 -- From the ionic app, define the car order and then select 'build'
 -- From the manufcturing page, commence manufacture
 -- From the VDA page, observe the chains being generated as the order progresses
 - Log into Playground and inspect transactions via Historian, and all items in the registry

Points to note:
 - If you get lost, or don't know what to do, ask
