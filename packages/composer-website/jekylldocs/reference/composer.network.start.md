---
layout: default
title: Hyperledger Composer Network Start CLI
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Composer Network Start
---

# {{site.data.conrefs.composer_full}} Network Start

---

The `composer network start` utility is used to deploy a business network archive from local disk to the {{site.data.conrefs.hlf_full}} endorsing peers.

_Please Note_: You **must** first install the {{site.data.conrefs.composer_full}} runtime to the {{site.data.conrefs.hlf_full}} endorsing peers by using the `composer runtime install` command. The business network name specified in the `composer runtime install` command must be the same as the business network name specified in the `composer network start` command.

```
composer network start -a <business-network-archive> -i <user-id> -s <user-id-secret>
```

### Options
```
composer network start [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --archiveFile, -a            The business network archive file name  [string] [required]
  --connectionProfileName, -p  The connection profile name  [string]
  --loglevel, -l               The initial loglevel to set (INFO|WARNING|ERROR|DEBUG)  [string]
  --option, -o                 Options that are specific specific to connection. Multiple options are specified by repeating this option  [string]
  --optionsFile, -O            A file containing options that are specific to connection  [string]
  --startId, -i                The id of the user permitted to start a network  [string] [required]
  --startSecret, -s            The secret of the user permitted to start a network, if required  [string]
```


## {{site.data.conrefs.hlf_full}} Endorsement Policies

The `--option, -o` option and the `--optionsFile, -O` option allow connection specific information to be sent. {{site.data.conrefs.hlf_full}} endorsement policies can be sent using the `-o` and `-O` options in several ways.

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

For more information on writing {{site.data.conrefs.hlf_full}} endorsement policies, see the [{{site.data.conrefs.hlf_full}} node SDK documentation](https://fabric-sdk-node.github.io/global.html#Policy).
