---
layout: default
title: Hyperledger Composer Network Deploy CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Deploy CLI
---

# {{site.data.conrefs.composer_full}} Network Deploy

---

The `composer network deploy` utility is used to deploy a business network archive from local disk to a {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}} network.
Before using this command, read the topic [Deploying and Updating Business Networks](../business-network/bnd-deploy.html).

```
composer network deploy -a digitalPropertyNetwork.bna -A admin -S -c PeerAdmin@hlfv1 -f admincard
```

## Considerations
This command creates a new card file. The connection profile in this card file comes from the card defined in the `-c|--card` option used to perform the request and the connection profile defines whether an identity in a card should be HSM managed or not. If the card used for the request is not HSM managed (as defined in the connection profle) then the card file created will not be HSM managed. Conversely if the card used for the request is HSM managed then the card file created will also be HSM managed.

### Options
```
composer network deploy [options]

Options:
  --help                             Show help  [boolean]
  -v, --version                      Show version number  [boolean]
  --archiveFile, -a                  The business network archive file name  [string] [required]
  --loglevel, -l                     The initial loglevel to set  [choices: "INFO", "WARNING", "ERROR", "DEBUG"]
  --option, -o                       Options that are specific specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O                  A file containing options that are specific to connection  [string]
  --networkAdmin, -A                 The identity name of the business network administrator  [string]
  --networkAdminCertificateFile, -C  The certificate of the business network administrator  [string]
  --networkAdminEnrollSecret, -S     Use enrollment secret for the business network administrator  [boolean]
  --card, -c                         The cardname to use to deploy the network  [string]
  --file, -f                         File name of the card to be created  [string]
```


## Example Output

```
composer network deploy -a digitalPropertyNetwork.bna -A admin -S -c PeerAdmin@hlfv1 -f admincard

Deploying business network from archive digitalPropertyNetwork.bna
Business network definition:
	Identifier: digitalproperty-network@0.0.1
	Description: Digital Property Network
Deploying business network definition. This may take a minute...
Command completed successfully.
```

## {{site.data.conrefs.hlf_full}} Endorsement Policies

The `--option, -o` option and the `--optionsFile, -O` option allow connection specific information to be sent. {{site.data.conrefs.hlf_full}} {{site.data.conrefs.hlf_latest}} endorsement policies can be sent using the `-o` and `-O` options in several ways.

- Using the `-o` option, the endorsement policy can be sent as a single-line JSON string as follows:

        composer network deploy -o endorsementPolicy='{"identities": [.... }'

- Using the `-o` option, the endorsement policy can be sent as a file path as follows:

        composer network deploy -o endorsementPolicyFile=/path/to/file/endorsementPolicy.json

	In this case, the endorsement policy file should follow this format:

		{"identities":[...],
			"policy": {...}}

- Using the `-O` option, the endorsement policy can be sent as a file path as follows:

        composer network deploy -O /path/to/file/options.json

	In this case, the options file should follow this format:

				{"endorsementPolicy": {"Identities": [...].
				    "policy: {...}"
				  },
				  "someOtherOption": "A Value"
				}

For more information on writing {{site.data.conrefs.hlf_full}} endorsement policies, see the [{{site.data.conrefs.hlf_full}} Node.js SDK documentation](https://fabric-sdk-node.github.io/global.html#Policy).
