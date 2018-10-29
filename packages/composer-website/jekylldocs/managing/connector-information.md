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

There are several cases where information specific to {{site.data.conrefs.hlf_full}} must be included in {{site.data.conrefs.composer_full}} commands, including `composer network install`, `composer network start` and `composer identity issue`. The `--option, -o` option and the `--optionsFile, -O` option allow connector specific information to be sent.

Multiple options can be specified using the `--option, -o` by repeating the tag, for example:

```
composer somecmd -o thisOpt=value2 -o thatOpt=value2
```

Alternatively you can create a single file to contain multiple options, for example a file called `someCmdOpts.txt` could contain:

```
thisOpt=value1
thatOpt=value2
```

To reference an options file, use the following format:

```
composer somecmd --optionsFile=someCmdOpts.txt
```

Some API's will also include the option to pass a generic options object including `AdminConnection.start()` and `AdminConnection.install()`

## Providing npm config settings for install

### CLI
The `npmrcFile` option is available on the `composer network install` command.

The `npmrcFile` option allows you to specify npm configuration information when {{site.data.conrefs.hlf_full}} builds the chaincode image for the {{site.data.conrefs.composer_full}} runtime.

For example rather than using the default npm registry, you can specify an internal registry within your organization by including the `registry` option in an options file:

```
registry=http://mycompanynpmregistry.com:4873
```

Supply the fully qualified filename as part of an install command, for example if the file was called npmConfig
in your /home/user1/config directory:

```
composer network install --c PeerAdmin@hlfv1 --a tutorial-network@0.0.1.bna -o npmrcFile=/home/user1/config/npmConfig
```

The file contents can be anything that permitted in the `.npmrc` configuration files of npm.

### Admin API

You can supply the name of the file as part of the AdminConnection api on the install method by specifying the `npmrcFile` property on the `installOptions` object. For example to pass the name of the npm configuration options file to be provided on install:

```javascript
await AdminConnection.install(businessNetworkDefinition, {npmrcFile: '/tmp/npmrc'});
```


## {{site.data.conrefs.hlf_full}} Endorsement Policies
You can provide {{site.data.conrefs.hlf_full}} endorsement policies to both network start and network upgrade requests. The examples that follow show `start` but the approach is identical to `upgrade` as well.

### composer network start/upgrade CLI

{{site.data.conrefs.hlf_full}} endorsement policies can be sent using the `-o` and `-O` options in several ways.

- Using the `-o` option, the endorsement policy can be sent either as a single-line JSON string or as a fully qualified file path:

```
composer network start ... -o endorsementPolicy='{"identities": [.... }'
```

```
composer network start ... -o endorsementPolicyFile=/path/to/file/endorsementPolicy.json
```

When a file path is specified, the endorsement policy file should follow this format:

		{"identities":[...],
			"policy": {...}}

- Using the `-O` option, the endorsement policy must be sent as a file path as follows:

        composer network start ... -O /path/to/file/options.json

	In this case, the options file should follow this format:

				{"endorsementPolicy": {"Identities": [...].
				    "policy: {...}"
				  },
				  "someOtherOption": "A Value"
				}

For more information on writing {{site.data.conrefs.hlf_full}} endorsement policies, see the [{{site.data.conrefs.hlf_full}} Node.js SDK documentation](https://fabric-sdk-node.github.io/global.html#ChaincodeInstantiateUpgradeRequest) which provides examples of endorsement policies.

### Admin API

To send an endorsement policy via the Admin API, the endorsement policy file must be included as part of the `startOptions` or `deployOptions` objects when calling start or deploy respectively. To pass an endorsement policy file it must be specified in the object property `endorsementPolicyFile`. To supply the policy as a JSON object, the `endorsementPolicy` object property must be specified.

```javascript
await adminConnection.start('tutorial-network', '0.0.1', { networkAdmins: networkAdmins,  endorsementPolicyFile: 'endorsement-policy.json'} );
```

## Identity Issue

When a new identity is issued, you may want to specify whether the issued identity has the authority to register new identities with a {{site.data.conrefs.hlf_full}} certificate authority server. 

### CLI

To grant an identity the authority to register new identities with a certificate authority from the command line, the `-x` option is available (which is a shortcut replacement for `-o issuer=true`).

```
composer identity issue -c admin@digitalproperty-network -u MyUser -a net.biz.digitalPropertyNetwork.Person#P1 -x
```

To define the affiliation to use specify `-o affiliation=org2.department1`. If you specifically don't want to specify an affiliation and not have the default of `org1` used, then specify as follows `-o affiliation=''`.

```
composer identity issue -c admin@digitalproperty-network -u MyUser -a net.biz.digitalPropertyNetwork.Person#P1 -o affiliation=org2.department1
```

### API

To specify the issuer property you set it in an object and pass this object as part of the `issueOptions` on `issueIdentity`.
For example to issue an identity that has issuer authority

```javascript
await businessNetworkConnection.issueIdentity(participantId, newUserId, {issuer: true});
```

To specify the affiliation property

```javascript
await businessNetworkConnection.issueIdentity(participantId, newUserId, {affiliation: 'org.department1'});
```

## Next steps

- Learn more about [connection profiles](../reference/connectionprofile.html).
