---
layout: default
title: Interacting with {{site.data.conrefs.hlf_full}}
category: tasks
section: managing
sidebar: sidebars/accordion-toc0.md
excerpt: {{site.data.conrefs.composer_full}} is designed to be platform-agnostic. This section is about specifics in relation to interacting
with {{site.data.conrefs.hlf_full}}.
index-order: 809
---

# {{site.data.conrefs.hlf_full}}

There are several cases where information specific to {{site.data.conrefs.hlf_full}} must be included in {{site.data.conrefs.composer_full}} commands, including `composer network deploy`, and `composer identity issue`.

Specific options for install/start/deploy

## providing npm config settings for install/deploy
-o npmrcFile
Allows you to specify npm configuration information when {{site.data.conrefs.hlf_full}} builds the chaincode image
for the {{site.data.conrefs.composer_full}} runtime. 
For example you may not want to go directly to the default npm registry, you may want to go to an internal
one within your organsation. To do this, create a file with the following
contents

```
registry=http://mycompanynpmregistry.com:4873
```
Pass the fully qualified filename as part of an install or deploy option, for example if the file was called npmConfig
in your /home/user1/config directory
```
composer runtime install -c PeerAdmin@hlfv1 -n digitalproperty-network -o npmrcFile=/home/user1/config/npmConfig
```
the file contents can be anything that is permitted in the `.npmrc` configuration files of npm.

## {{site.data.conrefs.hlf_full}} Endorsement Policies

The `--option, -o` option and the `--optionsFile, -O` option available on the `network start` and `network deploy` commands allow connection specific information to be sent. {{site.data.conrefs.hlf_full}} endorsement policies can be sent using the `-o` and `-O` options in several ways.

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

