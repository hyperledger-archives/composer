---
layout: default
title: IBM Blockchain Framework -  Support
category: support
sidebar: sidebars/support.md
---

##Welcome to the Support page.

See the options below to get help or support.

Please review the FAQs below to see if your question is already answered, otherwise get in touch using the options below:

## Slack

For Concerto questions, we use the [Concerto](https://ibm-blockchain.slack.com/#concerto) Slack channel.

Please e-mail Alex Markello (admarkel@us.ibm.com) if you require access to the [team](https://ibm-blockchain.slack.com) on Slack.

## Stack Overflow

Link tba


## Frequently Asked Questions

### Question 1

Is this targeted at v0.6 hyperledger?

#### Answer 1

Right now, we are on v0.6 yes.

### Question 2

When can we expect to start using concerto?

#### Answer 2

It’s still an alpha, but we want to release early, release often and incorporate as much feedback as possible and evolve this thing with you all.

### Question 3

Can Concerto support hierarchy - for example a manufacturing scenario, where a component is built with multiple parts, many such components go into bigger components and so on. For example, represent a whole car as well as the tiniest chip or bolt that goes in?

#### Answer 3

Concerto can model classes with relationships to other classes, so I don't see why not.

### Question 4

Is the framework a design time only tool, or is it by applications during any transaction invocation, i.e., runtime?

#### Answer 4

Both design time and runtime

### Question 5

Is there an outlook on when Fabric v1 will be supported?

#### Answer 5

We will start the port as soon as Fabric is stable / approaching GA. It’s the usual balance between being on the cutting edge / early validation of the underlying platform and getting stuff done. We have weekly calls with Jim Zhang (@jzhang, jzhang@us.ibm.com) and Gari Singh (@garisingh, garis@us.ibm.com) so I’m optimistic it won’t take us too long to port Concerto, and the breakage for Concerto users should be small.

### Question 6

If you aren't generating go or java code, how do you ensure that different apps have isolated data? If you had just one set of chaincodes interpreting the application description, wouldn't all endorsers/validators of that chaincode see data for all apps? How would you allow different endorsers for different apps? Do you have a different instance of the runtime for each time?

#### Answer 6

There is one instance of the Concerto Go "system" chaincode deployed for each business network (app), so that provides isolation between business networks.

### Question 7

One for each business network or one for each app?

#### Answer 7

Business Network Definition is a Concerto concept — is represents a set of participants that want to exchange assets using transactions. The Business Network Definition is isolated from other deployed Business Network Definitions by deploying it to its own chaincode. We are working on docs/glossary etc. for Playback 1 which will make this stuff much clearer… I hope!

### Question 8

Who would be the endorsers for the concerto chaincode(s)?

#### Answer 8

We will be updating the Concerto API's to account for the changes involving endorsers in fabric v1

### Question 9

Will the “early program” be useful for people who choose not to use Concerto?

#### Answer 9

The early program is really aimed at Concerto.  Now, Concerto layers on top of HL fabric, Concerto works nicely with HSBN already, so it will help you get going with all HL fabric deployments.  What it won't do is teach you how to write Go chaincode, because the programming model is much simpler.  (see the pinned video at the top of the #concerto slack channel within the Blockchain slack team).

### Question 10

Majority of the BC use cases will be about managing assets and transfers. Use cases like Trade Finance, Logistics, etc., which are about managing records and documents on BC for participating parties and controlling access to these records based on the permission configured for each party and the workflow state, is another class of use cases that can be modelled relatively easily by a simple smart contract program without having support for assets and transfers.  What are your thoughts for such use cases? SC Framework and SCDL is mainly for such use cases.

#### Answer 10

We chose the term "asset" as it has a real world feeling, and is business meaningful.  Actually, as per the white paper, we consider everything in concerto a "resource", which is actually a great technical term (URIs etc etc), and economic term (the allocation of scare resources). So, it's easy to see how we can think of documents as resources, or as assets, because they are valuable.  The key point about the term "asset" or "resource" is that it's something that's of value that's exchanged between counterparties in a business network. Net net, I think it either should be possible to model the documents as assets, or if we need to subclass them from resources. Either way they will work just fine I think.  That's not to say there isn't a huge amount of learning to be gained from this exercise, so thanks again for starting the discussion.

### Question 11

The early program will run on 0.6 but the framework will move to 1.0 as soon as the code is ready. What does this mean to the client given that 1.0 is so different from 0.6?

#### Answer 11

You'll be fine. The thing about concerto is that it abstracts away these issues.  Specifically, for endorser/consenter, we'll change submit transaction from being against the network to being against a counterparty, Business networks map directly to channels, and concerto already has the concept of linked resources, so different networks will be able to link to each other.  Finally, the new database support will make our queries more efficient. Net is that there will be small application changes on the submitTransaction API. The new stuff in V1 is super btw- the endorser consenter model mirrors what happens in the real wold.  For example, in HL 0.x if I want to do (e.g.) a funds transfer someone else in the network, I submit that transaction to the network.  In V1.x, I submit the transaction to my bank and then it makes sure that the transaction is endorsed appropriately - probably by making sure my bank and my counterparties bank agree the transaction.  Very nice indeed.

### Question 12

Does Concerto generate fully customizable code or are there other ways of extending existing functionality?

#### Answer 12

Concerto provides a modelling language and a set APIs for the user to develop applications against. We provide a JavaScript client API for building client applications, and a JavaScript runtime API for building transaction processor functions that run inside the Blockchain. You (the user) is fully in control of developing the JavaScript code that calls those APIs. The only code generation we are doing is generation of REST APIs (using Loopback) and generation of development time accelerators such as TypeScript bindings for the model. We're happy to hear any feedback we can get, and will be waiting for additional feature requests.

### Question 13

As a chaincode developer I’m curious how you managed to create this, especially without code generation. Does the code run with a different kind of baseimage to enable javascript, or do you interpret the javascript from within a golang or Java chaincode?

#### Answer 13

We use a JavaScript interpreter written in Go called [Otto](https://github.com/robertkrimen/otto) and that handles the execution of our "system" code and the users code. We have developed a Domain Specific Language for Concerto that allows users to model assets, participants, and transactions. That DSL is reasonably simple text that is designed to be easy for developers to hand write, for example:

```
asset Field identified by fieldID {
  o String fieldID
  o String name
  --> Business business // a relationship to the owning business
}
```

### Question 14

Were any thoughts given to using an embedded V8 rather than [Otto](https://github.com/robertkrimen/otto)?

#### Answer 14

We did *briefly* consider V8, but it would have meant custom bindings to Go. A full-blown Node runtime seems much more interesting. [Otto](https://github.com/robertkrimen/otto) allows us to test the programming model at low cost and then allow customers to drive us.

### Question 15

My understanding is that Concerto facilitates smart contracts in Javascript language on Hyperledger. To achieve this, does it provide some sort of Javascript SDK/APIs for developing smart contracts OR is it open for the developer to write 'any' Javascript code using the base language?

#### Answer 15

The JS you can write is “substantially” open. You can use ES5 syntax, but you cannot ‘require’ external packages. We provide a server-side JS API to interact with asset registries, create assets etc.

### Question 16

To run Javascript smart contract, is there a separate run time Concerto chaincode for each smart contract; Or is there a single run time Concerto chaincode for all smart contracts?

#### Answer 16

There is a generic Concerto chaincode (written in Go) that implements the server-side component of Concerto. When you deploy a Business Network Definition (the deployable artefact for Concerto) we also deploy a new copy of the Concerto chaincode. This is a design choice that was driven by our desire to prevent different Business Networks from potentially seeing each other’s world state.

### Question 17

Is it correct to say that Concerto design is mainly driven to support Assets (and transfers) on blockchain? Can it also support scenarios other than assets and transfers?

#### Answer 17

The fundamental programming model is: a transaction occurs on behalf of a participant, and this transaction needs to be stored on the BC, and may alter the state of assets that are being tracked in asset registries on the BC. We believe that this programming model is sufficiently general that it can be applied to a very wide range of BC problems. Time will tell!

### Question 18

What level of chaincode do you touch? Is it mostly JS?

#### Answer 18

A small Go "container" layer around mostly JavaScript code.

### Question 19

Is there some JavaScript code that is placed in the chaincode container?  If so, how is it exposed, called, triggered?

#### Answer 19

The JavaScript code is running in Go by using a JavaScript interpreter for Go.

### Question 20

Where is the code?

#### Answer 20

IBM GitHub Enterprise, part of Whitewater tools.

### Question 21

Where is the code published in npm?

#### Answer 21

IBM npm Enterprise, part of Whitewater tools.

### Question 22

Is there a UI to drive the creation of the data model, or is it just editing the text file?

#### Answer 22

Just editing text files at the moment.

### Question 23

Are the loopback REST APIs created dynamically based on the data model?

#### Answer 23

Yes, the Loopback APIs are created dynamically.

### Question 24

Does the developer enter the text, and the UML view dynamically creates?

#### Answer 24

Not yet, the UML is only updated when the model is deployed to the Blockchain.

### Question 25

Is the syntax of the file custom and parsed by Concerto/Composer to break out data model elements and business logic (JS code) based on parsing?

#### Answer 25

Yes, but we are working on splitting the data model and business logic into separate files.

### Question 26

I see the business logic JavaScript has syntax highlighting.  How is that implemented?

#### Answer 26

Using the open source CodeMirror component.

### Question 27

Will Concerto provide a Java API? Most of what I have seen so far focused on JavaScript.

#### Answer 27

Once Fabric has a Java equivalent of HFC then we can wrap it and build a Java API around it.

### Question 28

I have just started building a blockchain project with a client.  Is there an option to move all this into concerto because that looks a lot easier going forward to use? or do we have to re-create everything in concerto and there is really no Import into Concerto?

#### Answer 28

The approaches are very different (writing Go code, vs JS, defining a model using the CTO modelling language) etc. so I can’t realistically see a migration path

### Question 29

1 Perspective - New developers will want to leverage existing libraries at a basic programming model level.  They will feel limited by the inability to do that, but also the current model of having business logic isolated to a monolithic function call that must be completely handled in a single JS file.

#### Answer 29

We do have plans to improve that experience in the short term by adding support for "utility" functions that can be called from transaction processor functions, and we can look at making those available for use across multiple JS files.

### Question 30

Why was JavaScript selected as the business/scripting language for the transaction processor functions?

#### Answer 30

Some reasons: the HFC library used to access the Fabric is a JS library, so JS has to be part of the picture. We wanted to provide an experience that allowed someone to use a single programming language across an entire solution (front-end, mid-tier, and business logic). JS is a dynamic language that has some interesting properties in terms of dynamic deploy, code gen etc. The JS ecosystem is very large, and growing quickly, with lots of interesting 3rd-party libraries that may be of use. Most developers under the age of 25 are familiar with JS… and due to the number of new developers getting trained every year this demographic is very important. The npm package manager has some very interesting capabilities to share and reuse code and models, and it integrates very nicely with JS.

### Question 31

How can you use 3rd-party libraries without require?

#### Answer 31

You cannot at this point. When we get to a full Node.js runtime then TX processor functions could require 3rd-party modules.

### Question 32

I understand that Concerto uses “generic” (might be a better word for it) Go chaincode, and basically presents the interface a user interacts with in ES5. If I’m not mistaken, the fabric was architected to allow chaincode to be implemented in whatever language someone desires, since it just communicates via gRPC (as I understand, anyways). If providing a popular language (agreed, JS is popular and support for it would be good) and some modeling is the end game of Concerto (again, I could be mistaken here), then shouldn't the focus be on getting native JS chaincode + the modeling piece available as a library to be `require`‘d by whatever chaincode someone writes in the JS?

#### Answer 32

Yes, agreed. And given the number of times this has been asked/answered I can sense this would be popular!

### Question 33

Just working through the getting started doc...on the Publish Updated Business Network Definition to npm step...dumb question...where is this publishing to?  Internal NPM whitewater registry? I'm getting a Failed PUT 403 error...I had logged out for the day yesterday so closed my browser after doing the pre req work...guessing I need to redo that step?

#### Answer 33

The npm publish is going to the internal whitewater registry. Though you've raised a good point in that really that network is an example and if you wanted to try publishing a model/business network youself ideally it would be one to your own namespace or of a different name. I'll update the documents to be more clear about what publishing means. though to test out the getting started publishing to NPM isn't a mandatory part of getting a business network deployed.

### Question 35

What's the concerto connector web for?

#### Answer 35

Execution/testing in a web page.

### Question 36

In the getting started I'm trying the 'Generating an Application' steps using generator-concerto clone, after running npm install and link commands when I go to run the 'yo concerto' command is says yo: command not found.  Anything I can check to see why that wouldn't be working?  Under node_modules I see several yeoman-xxxx modules, but not exactly sure what they are.

#### Answer 36

Install the yeoman tool http://yeoman.io/

### Question 37

Is npm update specific to a directory where I have a package.json or is that command global?

#### Answer 37

`npm update` is locally - it's only global with the -g flag

### Question 38

When the term asset registry is used, ie animal registry, farm registry, business registry per playback 0...are those registries world state tables?  or is this handle some other way?

#### Answer 38

They are mapped down to world state tables.

### Question 39

Angular 2, we use that for our blockchain projects and are just looking into incorporating Loopback. Have you created a Loopback connector to talk to the smart contract? The mean expert angular 2 generators seem to work fine if you want to generate angular services and models.

#### Answer 39

Yes, we are building a Loopback connector for Concerto, and it will be open sourced along with the rest of Concerto. We demonstrate the power of having such a connector in the playback 0 video. It's currently not in a usable state though... we're working on that now.

### Question 40

Is composer the same thing as concerto but written in ts?

#### Answer 40

Concerto is the JS Framework, Composer is a web user interface built using Concerto. It allows you to define a business network (chaincode) on a webpage and test it — either against a real Hyperledger Fabric or a simulated Fabric running in the browser.
