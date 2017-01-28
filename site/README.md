# Concerto Documentation

This repository is holds the documentation for Concerto and the tools to create the static website for Concerto. This static site is hosted on the gh-pages branch of the main Concerto repo.  It also holds the scripts that create the API documentation; therefore this repo is in effect a node module that has a dependancy on the main Concerto modules.

# High Level Process
In summary the documentation is generated using both Jekyll and the jsdoc tool. These are run using scripts on within Travis, with output being pushed to the gh-pages branch of the Concerto git repository.

* The markdown files with the documentation are contained in a simple directory structure under `docs`
  * Images are in the `images` directory, (note considering if these should be moved under docs next to where they are referenced)
* The Jekyll template (with index, 404 html pages etc, web javascript, and css files) are in  `jekylldocs`
* All the controlling scripts are in `scripts` These are bash shell scripts.
    * Some additional scripts are in the `package.json` file that can be run with `npm run`
    * The `.travis.yml` does control some of the order the script execution
    * _the mix of the above three can lead to confusion and a possible are for simplification_
* The `out` directory is very important. The jsdocs output, the markdown files, the images are collected in the `out` directory. The template files in `jekylldocs` are copied in. This then forms the 'input' to the jekyll tool.  When jekyll is run it process this input to produce the complete static site in the `out/_site` directory.
* The final script `push-docs.sh` then pushes all the static site to the gh-pages branch

Important:  We are producing static html, (with css and web based javascript) and pushing that. There are many sites on line that talk about how github uses and (prohibits) in some cases aspects of Jekyll. These include various plugins, and relative paths. However a lot of that doesn't apply as we are using static html that github does not need to render. Therefore the relative paths are ok.

The key to getting this it work is the `site.baseurl` of the jekyll config. This should be set to `/Blockchain-WW-Labs/Concerto`
This is the default in the configuration. Note that when the travis build runs on your own fork of the repo, this is modified to be for example `/WHITEMAT/Concerto-Docs`. This enables you to look at the site in the gh-pages branch of your own fork ahead of a pull reqeust.

Input to jekyll does not need to be just markdown, it can also be HTML such as the API docs. These are processed by jekyll but unless you add anything specific to be processed, they are copied over to the site unchanged. This does permit possible modification etc in the future.

# In more detail
We'll look at the process in more detail, firstly the jsdocs tool. The travis execution is in the order

```
script: |
    set -ev
    npm run doc
    ./scripts/generate-uml.sh
    ./scripts/setup-jekyll.sh
    ./scripts/build-gh-pages.sh
after_success: ./scripts/push-docs.sh
```

## generator uml

to write... note that a Java Runtime is required for the plantuml even though it's being invoked from node.js

## jsdocs

1. The API documentation using jsdoc are created initially; the source for these are in the node_modules directory. This is achieved by the fact the concerto npms are dependancies in the package.json. So the source code that contains the jsdoc comments will be pulled down and be contained within the node_modules directory,
2.
    ```
    "composer-admin": "latest",
    "composer-client": "latest",
    "composer-common": "latest",
    "composer-runtime": "latest",
    ```
2.  The jsdcos tool is a node module that produces the API documentation.  This is invoked by issuing `npm run` commands. There are two targets for the public and private jsdoc

```
"docpub": "jsdoc --pedantic --recurse -c jsdoc.conf -t ./node_modules/ink-docstrap/template -a public,undefined -d ./out/public -R JSDOC-README.md",
```

3. `jsdoc.conf` is the configuration file - where to change footers and copyright etc.
4. Note the output location which is important - also the `-R JSDOC-README.md`   this is the front page of the JSDOC tools.

##Jekyll Configuration
The setup-jekyll.sh script is used in travis to setup jekyll. This is for travis' use. For local use install

1. Ruby & the Gem package manager
2. Install jekyll
3. Install redcarpet

Note: The ruby installation process does appear to require quite a number of pre-reqs. Which are poorly documented.
YMMV.

### Jekyll Template

The jekyll template and files are stored in this tree

```
├── jekylldocs
│   ├── 404.html
│   ├── assets
│   ├── _config.yml
│   ├── favicon.ico
│   ├── _includes
│   ├── index.html
│   ├── _layouts
│   ├── LICENCE
│   └── _plugins
```

* 404 and index.html are the 404 and index.html page as pure html
* assets is the css, javascript, and some basic images that are used
* _config.yml is the configuration of jekyll. Note the `site.baseurl`
* _includes has mixins/includes/snippets  that are pulled into the templates at key points. This is primary the header, sidebars, and the footer.
* _layouts are the liquid templates that control the overall structure of each page. There are a few here and I believe that only the base and default are used
* _plugins this is where the plugins to the jekyll engine are held. These are in ruby; we have a very simple one that covnerts any markdown reference page  eg  `[Concepts Outline](../concepts/outline.md)` will be converted into a link that refers to `../concepts/outline.html`

## Building yourself

### Personal fork and travis

When you push a change to your local fork of the Concerto-Docs repo, Travis will run. It will detect this fork and push to your local gh-pages. Two important things  (1) If you fork the Concerto-Docs repo, it will have a gh-pages branch - but github doesn't see this as having html in it. Delete and recreate it.

If you want the git push to work, you'll need to add into Travis, your ssl key for github enterprise.

### On your own laptop
This npm run target is setup ready to make things easy locally. You'll need ruby and jekyll installed. And this repo cloned, and npm install run.

Then simply run `npm run localpages`

  localpages
     npm run docpub && ./scripts/build-gh-pages.sh && ./scripts/run-jekyll-serve.sh

Note the call to the `./scripts/run-jekyll-serve.sh` - this kicks of the jekyll tool but in it's test html server manner. This opens localhost:4000 that you can navigate to see the real HTML.

## Directory structure

This is the directory structure
```
.
├── CONTRIBUTING.md
├── docs
│   ├── concepts
│   ├── images
│   ├── overview
│   ├── reference
│   ├── start
│   ├── support
│   ├── tasks
│   └── test
├── images
│   └── concerto_stack.png
├── jekylldocs
│   ├── 404.html
│   ├── assets
│   ├── _config.yml
│   ├── favicon.ico
│   ├── _includes
│   ├── index.html
│   ├── _layouts
│   ├── LICENCE
│   └── _plugins
├── jsdoc.conf
├── JSDOC-README.md
├── LICENSE.txt
├── node_modules
│   ├── ...
├── NOTICES.txt
├── out
│   ├── diagrams
│   ├── jekylldocs
│   └── public
├── package.json
├── README.md
└── scripts
    ├── build-gh-pages.sh
    ├── check-source-md.sh
    ├── generate-uml.sh
    ├── jekyll-pre-check.sh
    ├── push-docs.sh
    ├── run-jekyll-serve.sh
    └── setup-jekyll.sh
```
