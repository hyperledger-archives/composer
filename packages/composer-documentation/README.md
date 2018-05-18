# Hyperledger Composer Opus

A Proof-Of-Idea to see if the power of template engines, plus the Introspector API, and the NPM meta-data in a BusinessNeworkArchive could be used to generate a set of documentation for the archive.

This introspection of all the model files etc to get a set of data that can be then transformed into the desired output.



All the information is captured so the next step is (a) produce a set of established decorators such as 

```
@docs('This is some docs')
assert fred indetified by id {
  @docs('the primary key')
  o String id
}
```

That can be used to provide more in-depth documentation

## Example

Best seen with an example.... [https://ampretia.github.io/composer-opus/](https://ampretia.github.io/composer-opus/)

## Usage
```
$ npm install -g @ampretia/composer-opus
$ opus
Options:
  -a, --archive  Archive file to document                    [string] [required]
  -o, --outdir   Output Directory                    [string] [default: "./out"]
  -c, --config   path to the configuration file[string] [default: "config.yaml"]
  --help         Show help                                             [boolean]

```

There is a default template and set of structure already defined as a default. This could be customized to suit and it is not restricted to handling markdown and 
html.

## Configuration
The example site was produced with this configuration file - this is in yaml format as the flow through the system is hierarchical

```yaml
--- 
tasks:
    #  Root task that defines common data for all tasks
    taskid : root
    processor : root
    options :
        outputdir : ${_args.outdir}
        templateroot: ${default.template}
        tempdir : ${default.temp}     
    subtasks :
    #  Use Hyperledger Composer taks to extract all information and setup the context
    -   taskid : ParseNetwork
        processor : composernetwork
        options :
            archive : "${_args.archive}"   
    #  Uses multiple templates specified in 'inputdir' & 'pattern' to work on the context and produce markdown output files
    -   taskid : CreateMarkdown
        processor : njk_multi
        options :
            inputdir : "phase1-markdown"
            pattern : "**/*.njk"
            outputextension : ".md"
            outputdir : "${root.tempdir}"
       
    # From the markdown files that are created previously generate html
    # This is a two step process, files needs to converted into html and then wrapped in
    # the correct header/footer etc. Stream tasks allows the output from one task to go into the second
    -   taskid : HTML
        processor: stream
        options :
            inputdir : "${root.tempdir}"
            pattern : "**/*.md"
            outputdir : "${_args.outdir}"
            streamId : html1          
        subtasks :
            # For each markdown file stream into it this will convert into html and pass on the details via the stream"          
            -   taskid : markdownhtml
                processor : markdownit
            # Single template to be used to process files via stream along with the context
            -   taskid : htmlrender
                processor : njk_single
                options :
                    inputdir : "phase2-html"
                    template : html.default.njk
                    extension: ".html"
    # Finally need to copy the fixed assets to the output directory "
    -   taskid : FinalStep
        processor : copy
        options :
            srcdir : "${root.templateroot}/assets.default/**/*" 
            destdir : "${_args.outdir}/assets"  
         

```

## Details
At first glance this is complex, but let's break it down bit by bit. The basic idea is there is a sequence of tasks that will be executed in order. These can form a tree so that it is possible to group the tasks.

```yaml
--- 
tasks:
    #  Root task that defines common data for all tasks
    taskid : root
    processor : root
    options :
        outputdir : ${_args.outdir}
        templateroot: ${default.template}
        tempdir : ${default.temp}     
    subtasks :
```

This defines the top level tasks - identified by *taskid* and the *processor* that will be used to handle this task

> Each task needs a *taskid* and a *processor*

This takes some options, namely the *outputdir*, *templateroot* and *tempdir*. These are standard and best left as is. Note the `${_args.outdir}` is taking the output directory from the command line options.

Sub tasks can be defined and appear under the *subtasks*

```yaml

    #  Use Hyperledger Composer taks to extract all information and setup the context
    -   taskid : ParseNetwork
        processor : composernetwork
        options :
            archive : "${_args.archive}"   
```

This is the first subtasked processed using the *composernetwork* processor. This takes the archive specified on the command line and processes it to extract all the data. This is held in an internal 'context'

This tasks has no subtasks, so execution moves on.

```yaml
    #  Uses multiple templates specified in 'inputdir' & 'pattern' to work on the context and produce markdown output files
    -   taskid : CreateMarkdown
        processor : njk_multi
        options :
            inputdir : "phase1-markdown"
            pattern : "**/*.njk"
            outputextension : ".md"
            outputdir : "${root.tempdir}"
```
A more complex task,but this uses the *njk_multi* processor. Using [nunjucks](https://mozilla.github.io/nunjucks/) a set of templates are processed against the internal context to generate a set of markdown files. 

The options determine where these are (all relative paths such as the *inputdir* are rooted at the *templateroot* seen earlier on).

The output of these files is stored in a temporary location.

Note that the output of these files is markdown format because (a) that's what the template is set up to produce and (b) because of the extension specified in the options.

Again this task has no subtasks

```yaml
    # From the markdown files that are created previously generate html
    # This is a two step process, files needs to converted into html and then wrapped in
    # the correct header/footer etc. Stream tasks allows the output from one task to go into the second
    -   taskid : HTML
        processor: stream
        options :
            inputdir : "${root.tempdir}"
            pattern : "**/*.md"
            outputdir : "${_args.outdir}"
            streamid : html1          
        subtasks :
            # For each markdown file stream into it this will convert into html and pass on the details via the stream"          
            -   taskid : markdownhtml
                processor : markdownit
            # Single template to be used to process files via stream along with the context
            -   taskid : htmlrender
                processor : njk_single
                options :
                    inputdir : "phase2-html"
                    template : html.default.njk
                    extension: ".html"
```
This is the most complex task and makes use of the ability to group tasks together. The aim here is to take the markdown files produced previously, and render these as html. This is a two stage process. First the files need converting from markdown to html, and then the core html needs to be wrapped in headers, footers etc. 

This is accomplished by a using a *stream* tasks. This takes inputdir, patter, and an outputdir. It reads all the input, passes it to the first subtask, gets the output, passes it to the next subtask before writing it all to the output dir.

The first subtask (markdownhtml) does the conversion of each markdown file read into html. 
The second subtask (htmlrender) again uses nunjucks but this is using a single template to transform input to output (basically adding the header)

```yaml
    # Finally need to copy the fixed assets to the output directory "
    -   taskid : FinalStep
        processor : copy
        options :
            srcdir : "${root.templateroot}/assets.default/**/*" 
            destdir : "${_args.outdir}/assets"  
```

Final step is a copy to move the 'assets' i.e. css files into the correct location.

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.