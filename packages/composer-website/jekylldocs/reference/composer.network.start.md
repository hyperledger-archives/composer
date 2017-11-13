---
layout: default
title: Hyperledger Composer Network Start CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Start
---

# {{site.data.conrefs.composer_full}} Network Start

---

The `composer network start` utility is used to deploy a business network archive from local disk to a {{site.data.conrefs.hlf_full}} v1.0 network.
Before using this command, read the topic [Deploying and Updating Business Networks](../business-network/bnd-deploy.html).

_Please Note_: You **must** first install the {{site.data.conrefs.composer_full}} runtime to the {{site.data.conrefs.hlf_full}} peers by using the `composer runtime install` command. The business network name specified in the `composer runtime install` command must be the same as the business network name specified in the `composer network start` command.

```
composer network start -a <business-network-archive> -A <admin-name> -S adminpw -c <business-network-card> -f <name-of-admin-card>
```

### Options
```
composer network start [options]

Options:
  --help                             Show help  [boolean]
  -v, --version                      Show version number  [boolean]
  --archiveFile, -a                  The business network archive file name  [string] [required]
  --loglevel, -l                     The initial loglevel to set  [choices: "INFO", "WARNING", "ERROR", "DEBUG"]
  --option, -o                       Options that are specific specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O                  A file containing options that are specific to connection  [string]
  --networkAdmin, -A                 The identity name of the business network administrator  [string]
  --networkAdminCertificateFile, -C  The certificate of the business network administrator  [string]
  --networkAdminEnrollSecret, -S     Use enrollment secret for the business network administrator  [string]
  --card, -c                         The cardname to use to start the network  [string]
  --file, -f                         File name of the card to be created  [string]
```


## {{site.data.conrefs.hlf_full}} Endorsement Policies

The `--option, -o` option and the `--optionsFile, -O` option allow connection specific information to be sent. {{site.data.conrefs.hlf_full}} endorsement policies can be sent using the `-o` and `-O` options in several ways.

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
