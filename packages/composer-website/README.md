# Hyperledger Composer Documentation

This directory ( composer/packages/composer-website ) hold the documentation for Hyperledger Composer and the tools to create the static website for Hyperledger Composer. This static site is hosted on an organization static site in GitHub (https://github.com/hyperledger/composer).

# Getting Started for local work
- Assume that you have a clone of the composer repository locally.
- Install Ruby;  a good guide to installing ruby is [here](https://www.digitalocean.com/community/tutorials/how-to-install-ruby-on-rails-with-rbenv-on-ubuntu-16-04) but *stop* before installing Rails.  Installation of Ruby-dev, and subsequently Gem, are all that are required.
- Install Jeykll, jekyll-sitemap, redcarpet.  The scripts directory contains a setup-jekyll script that does setup these. But you must have performed the Ruby installation first.

```
$ ./scripts/setup-jekyll.sh
```

- Next step is to run or rerun the `lerna bootstrap` in the root of the composer repoistory.
- Make the changes you want to any of the md files under the jekylldocs directories. Be careful if modifing anything in a directory starting with an underscore. Those are the template files.
- Issue `npm run jeykllserve` and then go to the url that you get given at the end.
- What you can do is modify the file you are working on and jekyll will rebuild the docs dynamically. (though you have to refresh the browser).
- Then push your changes as per usual.

# Reference information

## High Level Process
In summary the documentation is generated using both Jekyll and the jsdoc tool. These are run using scripts within Travis, with output being pushed to hyperledger.github.io/composer when a merge build occurs. Pull Request builds do build all the docs but do nothing with them.

* The markdown files with the documentation are contained in a simple directory structure under `jekylldocs`
  * Images should be in the directory structure and reference like any other file *using relative paths*
* The Jekyll template (with index, 404 html pages etc, web javascript, and css files) are in  `jekylldocs` but in directories that are prefixed by an underscore and also the assets directory.
* All the controlling scripts are in `scripts` These are bash shell scripts.
    * Some additional scripts are in the `package.json` file that can be run with `npm run`
    * The `.travis.yml` does control some of the order the script execution
* An out directory is created during build - this is only used for temporary working files.

*Important:*  We are producing static html, (with css and web based javascript) and pushing that. There are many sites on line that talk about how github uses and (prohibits) in some aspects of Jekyll. These include various plugins, and relative paths. However a lot of that doesn't apply as we are using static html that github does not need to render, just acts as a webserver.

The key to getting this it work is the `site.baseurl` of the jekyll config. This should be set to NOTHING  [if we had a gh-pages branch on a private repo this would need to be modified]

Input to jekyll does not need to be just markdown, it can also be HTML such as the API docs. These are processed by jekyll but unless you add anything specific to be processed, they are copied over to the site unchanged.

# In more detail
We'll look at the process in more detail, firstly the jsdocs tool.

## generator uml

_to write... note that a Java Runtime is required for the plantuml even though it's being invoked from node.js_

## jsdocs

 The template for the jsdocs is within the jsdoc-template directory, along with the all the jsdoc configuration files.

1. The API documentation using jsdoc are created initially; the source for these are in the node_modules directory. This is achieved by the fact the Hyperledger Composer npms are dependancies in the package.json. So the source code that contains the jsdoc comments will be pulled down and be contained within the node_modules directory,
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
5. By using the lerna bootstrap it allows JSDocs to be correctly pointed to the current source code.

##Jekyll Configuration
The setup-jekyll.sh script is used in travis to setup jekyll. This can be used locally after Ruby installation

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
* \_config.yml is the configuration of jekyll.
* \_includes has files that are pulled into the templates at key points. This is primary the header, sidebars, and the footer.
* \_layouts are the liquid templates that control the overall structure of each page. There are a few here and I believe that only the base and default are used
* \_plugins this is where the plugins to the jekyll engine are held. These are in ruby; we have a very simple one that converts any markdown reference page  eg  `[Concepts Outline](../concepts/outline.md)` will be converted into a link that refers to `../concepts/outline.html`
