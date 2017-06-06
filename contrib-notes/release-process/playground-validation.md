# Playground Validation
The following describes manual testing required for Playground, to be complete prior to release. The aim of these tests are to try and guard against regressions, and it is the intention to move all of the listed manual tests to automated Protractor tests.

Testing is to be performed against the unstable versions of:
 - [Composer Playground on Bluemix](http://composer-playground-unstable.mybluemix.net/)
 - Hyperledger/composer-playground Docker image on local machine

## Obtaining Playground Unstable Local Image
Pre-requisites:
 - [Docker](https://docs.docker.com/engine/installation/#supported-platforms)
 - [Docker Compose](https://docs.docker.com/compose/install/)

Those working on Ubuntu may follow the following guide to automatically install all required components:

```
$ curl -O https://raw.githubusercontent.com/hyperledger/composer-sample-applications/master/packages/getting-started/scripts/prereqs-ubuntu.sh
$ chmod u+x prereqs-ubuntu.sh

$ ./prereqs-ubuntu.sh
```

To obtain the unstable local image:
 - Ensure machine has docker and docker-compose installed (above)
 - Clear any running containers

```
 docker ps -aq | xargs docker rm -f
 docker images -aq | xargs docker rmi -f
```

 - Get and run the install script
``` 
 curl -O https://hyperledger.github.io/composer/install-hlfv1.sh
 cat install-hlfv1.sh | bash
```

We now need to swap out the underlying stable docker image, with the unstable. We can do this by modifying the files that were pulled down via the install script. 
 - Remove existing containers
```
 docker ps -aq | xargs docker rm -f
```
 - Remove the composer playground image only
```
 docker rmi hyperledger/composer-playground 
```
 - Edit composer-data/docker-compose.yaml file to point to tag :unstable for the composer image within the yaml file
 ```
 composer:
    container_name: composer
    image: hyperledger/composer-playground:unstable

 ```
 - Edit composer.sh to comment out lines that would cause overwriting the composer-data directory and contents
```
    # Create a work directory for extracting files into.
    WORKDIR="$(pwd)/composer-data"
    # rm -rf "${WORKDIR}" && mkdir -p "${WORKDIR}"
    cd "${WORKDIR}"

    # Find the PAYLOAD: marker in this script.
    # PAYLOAD_LINE=$(grep -a -n '^PAYLOAD:$' "${SOURCE}" | cut -d ':' -f 1)
    # echo PAYLOAD_LINE=${PAYLOAD_LINE}

    # Find and extract the payload in this script.
    # PAYLOAD_START=$((PAYLOAD_LINE + 1))
    # echo PAYLOAD_START=${PAYLOAD_START}
    # tail -n +${PAYLOAD_START} "${SOURCE}" | tar -xzf -

    # Pull the latest Docker images from Docker Hub.
```
 - Run the composer.sh script to install the new image
 ```
  ./composer.sh
 ```
 - You should now be able to see that the docker image for hyperledger/composer-playground is tagged with unstable.
 ```
    user@uvm:$ docker images
    REPOSITORY                        TAG                  IMAGE ID            CREATED             SIZE
    hyperledger/composer-playground   unstable             bbd4a7f443d4        15 hours ago        337 MB
 ```

You should now be able to access the unstable docker build image at http://localhost:8080

## Platform/OS Variations for Playground Testing
Playground testing should be performed on Ubuntu and OS-X operating systems.

Playground testing should be performed on the following browsers:
 - Chrome
 - Safari
 - Firefox
 - Edge
At a minimum, Safari (OS-X) and Chrome/firefox (Ubuntu) should be investigated. Different browsers may render components differently, and this needs to be accounted for, with issues raised as appropriate. A simple rendering issue may not invalidate the release build if it does not prevent user action. Such rendering issues can be added to "known issues" for the build release.

From the initial logon, the user should be presented with the “Hello World” landing page, with the Basic Sample Network loaded. And it is here we will start the Playground testing.

## Playground Test Areas

### Define Page (Side Navigation)
The define page is used to manage files and file content. Through the side navigation menu it is possible to perform working file selection/creation, and lifecycle actions such as import, export and deploy.

Start with the basic sample network loaded
 - Click on "Export", this should should export the current basic-sample-network to the downloads directory
    - BNA should contain script files in lib directory
    - BNA should contain model files in models directory
    - BNA should contain ACL file in parent directory
    - BNA should contain README.md in parent directory
 - Add file button should bring up AddFile modal. If a file is added, it should become the focal item and be indicated as selected (blue side bar)
    - Should be able to close modal via cancel button
    - Should be able to close modal via “x” icon (top right)
    - Should be able to select model/script file and cancel out, without the file being added
    - Upon each instance of adding a new file, the editor should show as dirty, indicated by enabling the “deploy” button
    - Should be able to add a script file via radio button and view the new file in the side navigation
    - Should be able to add additional script files, with their name incrementing
    - Should be able to add a Model file via radio button option and view the new file in the side navigation
    - Should be able to add a script or model file via browse option, upon selection item should appear in navigation bar with the correct name and extension.
    - Should be able to add a script file or model file via a drag and drop operation on the AddFile modal. Files should appear on side navigation with correct name and extension.
    - All loaded files should show correct content upon selection.
 - Import/replace button should bring up the Import/replace modal
    - Should be able to import previously exported BNA via browse option
    - Should be able to import previously exported BNA via drag and drop action
    - Should be able to authenticate with github and have access to all samples
    - All samples should import
Following from reset to basic sample network by import of the basic sample network 
 - Add script file, deploy button should enable. Following clicking the deploy button
    - success notification should show
    - deploy button no longer active
    - All files previously visible remain in navigation
 - Add model file, deploy button should enable. Following clicking the deploy button
    - success notification should show
    - deploy button no longer active
    - All files previously visible remain in navigation
 - Repeat to add another script and model file
 - On export, exported BNA should contain the newly added files (2 script, 2 model)

### Define Page (File-Editor)
This page is the main file editor page, where it is possible to edit resources. We need to ensure that the linking between the side navigation menu and the file editor is consistent, that validation errors report correctly for each file type and that file specific edit options are enabled. 

Start with the basic sample network loaded
 - ReadMe should be default selected for view
    - No delete icon visible at top right of editor page
    - Can see/edit BND name/version and complete package information
 - Side navigation should be linked to the edit page.
    - Cycle through each file in the navigation menu. Upon selection of a file item, the content should be displayed in the main file-editor page.
 - Add a new model file, it should become the focal item and the empty contents should show in the editor page.
    - Delete icon should be visible on top right of editor, selecting it should bring up a confirmation modal
    - Cancel should return without deleting the file
    - Confirm should delete the file, show a success message, and return the user to viewing the Readme file
 - Add a new script file, it should become the focal item and the empty contents should show in the editor page.
    - Delete icon should be visible on top right of editor, selecting it should bring up a confirmation modal
    - Cancel should return without deleting the file
    - Confirm should delete the file, show a success message, and return the user to viewing the Readme file
 - Select the main model file
    - Edit the namespace – ACL file should show in error due to validation
    - Change the namespace back – ACL file should be valid again
    - Edit the file to cause a breakage, it should show an error message under the editor. repeair the file and the error message should disappear.
    - Edit the model namespace, select ACL file and change the target namespace to match the edited model file – the ACL file should no longer be in error
 - Select the script file
    - Edit the file to cause a breakage, it should show an error message under the editor. Repair the file and the error message should disappear.
    - Make some non-breaking changes to the script file
 - Select the Readme file
    - Select edit icon and change the name and version of the readme.
    - Select to edit full package, ensure changes made in step above are persisted
    - Change the description of the package
    - Select the readme in navigator again to exit, and check changes have been persisted

The package, script, model and acl files should now all be different from the import version
 - Deploy the new definition, check that the file edits have persisted
 - Export the new definition, check that the changes are reflected in the exported file

Add 2 new model files and 2 new script files
 - Navigate to the test page, return to the define page, delete a model file and a script file. Files should delete, with success message
 - Navigate to the admin page, return to the define page, delete a model file and a script file. Files should delete, with success message

Select ACL file
 - Change operation field from ALL to CREATE, DELETE, READ, UPDATE
 - Deploy button should be active
 - Change resource field to be “org.acme.sam”
 - Error message should show
 - Reverse change to resource field
 - Error message should disappear

Select the main model file and delete it
 - Deploy button should not be active
 - ACL file navigation menu should be shown in error (via red indicators)
 - Navigate to ACL file, error should be shown at bottom of editor
 - Add a new model file
 - Change ACL file resource to be “org.acme.model”
 - Error should disappear and deploy button should be active


### Test and ID Page
The test page enables testing of the currently deployed Business Network Definition, using a web runtime. The ID page enables access to resources based upon a selected ID existing within the BND. The Admin ID is a default ID, though in testing we will create new IDs and interact with resources based on the newly defined IDs that have ACL rules applied.

Start by importing the vehicle lifecycle network using the side menu option on the Define page.
 - Navigate to the test page and submit a transaction
    - Submit transaction modal should appear
    - Invalidate the json data by removing a comma
    - An error message should appear and the submit button should deactivate
    - Fix the json data
    - The error message should disappear and the submit button should activate
    - Within the Transaction Type drop down, select “SetupDemo” and then click on Submit
    - Should see a success message
    - Should be dropped into the Transaction registry
    - Should see the transaction processed, with the action named in the $class, along with a transaction Id and timestamp field.
 - Navigate back to test page and open ACL file
    - Edit original rule
        - Change operation to READ
    - Add a new rule (copy/paste original default rule)
        - Name it “CreateDefault”
        - Change operation to READ, CREATE
        - Change resource to “org.vda.Vehicle”
        - Change participant to “org.acme.vehicle.lifecycle.PrivateOwner#dan”
    - Add a new rule (copy/paste original default rule)
        - Name it “CreateDeleteDefault”
        - Change operation to READ, CREATE, DELETE
        - Change resource to “org.vda.Vehicle”
        - Change participant to “org.acme.vehicle.lifecycle.PrivateOwner#simon”
    - Deploy the new definition

We will now create some IDs to use
 - Navigate to Wallet page (click on “admin”) to add new identities
    - Create new identities for simon and dan from above ACL rules:	
        - Click issue new ID
        - Add name corresponding to operation and participant name granted in above (for instance dan_create)
        - Add participant by typing name (it will autocomplete on dan or simon)
        - Tick box All to issue new IDs
        - Create new
        - Add to Wallet
- Select Create ID (dan_create) and navigate to test page. At this point all actions will be performed under the dan_create ID.
    - On the Assets tab, select vehicle,
    - Should see a list of vehicles
    - Create a vehicle (via create new asset button)
    - Should succeed with new vehicle being appended to list
    - Select a vehicle in the list and try to delete it
    - Error should return indicating no access
 - Select CreateDelete id (simon_create_delete) and navigate to test page
    - On the Assets tab, select vehicle,
    - Should see a list of vehicles
    - Create a vehicle (via create new asset button)
    - Should succeed with new vehicle being appended to list
    - Select a vehicle in the list and try to delete it
    - Should succeed

### New Feature Testing

All new features added for the release, which will be named in the release notes outline, should be proven on the unstable build. At this point some exploratory testing needs to be investigated, in an attempt to break the delivered feature and/or knowingly drive it towards a state where features could be working from invalid information.

### Exploratory Testing

Different users will attempt different things, be starting from different points with different skill level. Options to consider

 - Add a new asset type to a model and a new transaction, or write a new model from a different business domain
 - Review the questions found in the week on StackOverflow & Rocket.Chat - how did the user get to the position they are in?
 - What new PRs have gone in this week - how could they deployed and used in the existing networks?