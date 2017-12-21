---
layout: default
title: Interacting with Hyperledger Fabric
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer is designed to be platform-agnostic. This section is about specifics in relation to interacting with Hyperledger Fabric.
index-order: 810
---

# {{site.data.conrefs.hlf_full}}

There are several cases where information specific to {{site.data.conrefs.hlf_full}} must be included in {{site.data.conrefs.composer_full}} commands, including `composer network deploy`, and `composer identity issue`.

The `--option, -o` option and the `--optionsFile, -O` option available on the certain commands allow connection specific information to be sent.

You can specify multiple options using the `--option, -o` by repeating the tag, for example 
```
composer somecmd -o thisOpt=value2 -o thatOpt=value2
```

Alternatively you can create a single file to contain multiple options, for example a file called someCmdOpts.txt could contain

```
thisOpt=value1
thatOpt=value2
```

and use this file
```
composer somecmd --optionsFile=someCmdOpts.txt
```

Some API's will also include the option to pass a generic options object including AdminConnection.start() and AdminConnection.install()

## providing npm config settings for install/deploy

### CLI
The following option is available is available on the `composer runtime install` and `composer network start` commands.
- npmrcFile
Allows you to specify npm configuration information when {{site.data.conrefs.hlf_full}} builds the chaincode image
for the {{site.data.conrefs.composer_full}} runtime. 
For example you may not want to go directly to the default npm registry, you may want to go to an internal one within your organsation. To do this, create a file with the following
contents

```
registry=http://mycompanynpmregistry.com:4873
```
Pass the fully qualified filename as part of an install or deploy option, for example if the file was called npmConfig
in your /home/user1/config directory
```
composer runtime install -c PeerAdmin@hlfv1 -n digitalproperty-network -o npmrcFile=/home/user1/config/npmConfig
```
the file contents can be anything that are permitted in the `.npmrc` configuration files of npm.

### Admin API

You can pass the name of the file as part of the AdminConnection api on either the install or deploy methods by specifying the `npmrcFile` property on the installOptions or deployOptions object. For example to pass the name of the npm configuration options file to be provided on install you might do

```
await AdminConnection.install(businessNetworkDefinition.getName(), {npmrcFile: '/tmp/npmrc'});
```


## {{site.data.conrefs.hlf_full}} Endorsement Policies

### composer network start/deploy CLI

{{site.data.conrefs.hlf_full}} endorsement policies can be sent using the `-o` and `-O` options in several ways.

- Using the `-o` option, the endorsement policy can be sent as a single-line JSON string as follows:

        composer network start -o endorsementPolicy='{"identities": [.... }'

- Using the `-o` option, the endorsement policy can be sent as a file path as follows:

        composer network start -o endorsementPolicyFile=/path/to/file/endorsementPolicy.json

	In this case, the endorsement policy file should follow this format:

		{"identities":[...],
			"policy": {...}}

- Using the `-O` option, the endorsement policy can be sent as a file path as follows:

        composer network start -O /path/to/file/options.json

	In this case, the options file should follow this format:

				{"endorsementPolicy": {"Identities": [...].
				    "policy: {...}"
				  },
				  "someOtherOption": "A Value"
				}

For more information on writing {{site.data.conrefs.hlf_full}} endorsement policies, see the [{{site.data.conrefs.hlf_full}} Node.js SDK documentation](https://fabric-sdk-node.github.io/global.html#Policy).

### Admin API

To be able to send an endorsement policy via the Admin api, you include this as part of the startOptions or deployOptions object when calling start or deploy respectively. To pass an endorsement policy file you specify it in the object property `endorsementPolicyFile` and if you want to pass a JSON object of the policy you specify the object property `endorsementPolicy`. So for example to send a endorsement policy file on a start request I might do

```
await adminConnection.start(businessNetworkDefinition, { networkAdmins: networkAdmins,  endorsementPolicyFile: 'endorsement-policy.json'} );
```

## Identity Issue

You can specify whether the identity you issue has issuer authority, ie that identity can also register new identities on a fabric-ca server. 

### CLI
The available option is
- issuer

For example to issue an identity that itself have issuer authority and bind it to an existing participant you might do
```
composer identity issue -p hlfv1 -n digitalproperty-network -i admin -s adminpw -u MyUser -o issuer=true -a net.biz.digitalPropertyNetwork.Person#P1
```

## API
To specify the issuer property you set it in an object and pass this object as part of the issueOptions on issueIdentity.
For example to issue an identity that has issuer authority
```
await businessNetworkConnection.issueIdentity(participantId, newUserId, {issuer: true});
```

## Connection Profiles
(TBD: Link required to connection profiles reference section)
