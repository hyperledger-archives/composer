---
layout: default
title: Hyperledger Composer Network Deploy CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Deploy CLI
---

# {{site.data.conrefs.composer_full}} Network Deploy

---

The `composer network deploy` utility is used to deploy a business network archive from local disk to a Hyperledger Fabric runtime.

```
composer network deploy -a <business-network-archive> -i <enrollment-id> -s <enrollment-secret>
```

### Options
```
--help                       Show help  [boolean]
--version, -v                Show version number  [boolean]
--archiveFile, -a            The business network archive file name  [string] [required]
--connectionProfileName, -p  The connection profile name  [string]
--enrollId, -i               The enrollment ID of the user  [string] [required]
--loglevel, -l               The initial loglevel to set (INFO|WARNING|ERROR|DEBUG)  [string]
--option, -o                 Options that are specific specific to a connection. Multiple options are specified by repeating this option  [string]
--optionsFile, -O            A file containing options that are specific to connection  [string]
--enrollSecret, -s           The enrollment secret of the user  [string]
```

## Example Output

```
composer network deploy -a digitalPropertyNetwork.zip -i WebAppAdmin -s DJY27pEnl16d
Deploying business network from archive digitalPropertyNetwork.zip
Business network definition:
	Identifier: digitalproperty-network@0.0.1
	Description: Digital Property Network
Deploying business network definition. This may take a minute...
Command completed successfully.
```

## {{site.data.conrefs.hlf_full}} Endorsement Policies

The `--option, -o` option and the `--optionsFile, -O` option allow connection specific information to be sent. {{site.data.conrefs.hlf_full}} RC endorsement policies can be sent using the `-o` and `-O` options in several ways.

- Using the `-o` option, the endorsement policy can be sent as a single-line JSON string as follows:

<<<<<<< HEAD
        composer network deploy -o endorsementPolicy='{"endorsementPolicy": {"identities": [.... }'
=======
        composer network deploy -o endorsementPolicy='{"identities": [.... }'
>>>>>>> hyperledger/master

- Using the `-o` option, the endorsement policy can be sent as a file path as follows:

        composer network deploy -o endorsementPolicyFile=/path/to/file/endorsementPolicy.json

<<<<<<< HEAD
=======
	In this case, the endorsement policy file should follow this format:

		{"identities":[...],
			"policy": {...}}

>>>>>>> hyperledger/master
- Using the `-O` option, the endorsement policy can be sent as a file path as follows:

        composer network deploy -O /path/to/file/options.json

<<<<<<< HEAD
=======
	In this case, the options file should follow this format:

				{"endorsementPolicy": {"Identities": [...].
				    "policy: {...}"
				  },
				  "someOtherOption": "A Value"
				}

>>>>>>> hyperledger/master
For more information on writing {{site.data.conrefs.hlf_full}} endorsement policies, see the [{{site.data.conrefs.hlf_full}} node SDK documentation](https://fabric-sdk-node.github.io/global.html#Policy).
