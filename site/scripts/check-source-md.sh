#!/bin/bash
# takes two parameters
# $1 is full filename (from 'jekyll' directory) and $2 is the sidebar it should be attached to

# Exit on first error, print all commands.

set -ev

# Grab the source directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

###### This section looks for embedded inline .md links - ultimately - in HTML -
###### such links should be SUFFIXED as - .html LINK - and not an .md LINK-
###### Jekyll doesn't transform the suffix the final <a href>txt</a> transform
echo "replacing inline .md links in source markdown to .html based link"
cat $1 |sed -e "s/\]\(.\+\.md\)/\]\1\.html/g" -e "s/\.md\.html/\.html/g" |sed -e "s/\]\(.\+\.md\)/\]\1\.html/g" -e "s/\.md\.html/\.html/g" > $1.raw

mv $1.raw $1 ; stat=$?

[ $stat -eq 0 ] && echo File $1 links have been transformed || echo "move from .raw to orig file $1 went wrong - please check"

export YAMLHDR=/tmp/YAML.hdr

# TODIR here - is the same as working directory build-gh-pages.sh  - this does a final check on .md links and yaml headers plus menu setup tasks
export TODIR=${DIR}/temp/jekylldocs/

cd ${TODIR}


# 1. check if YAML title exists or --- header and trailer (however long) prepended
grep -q "^title:" $1 ; res=$?
cnt=$(grep -c "^---$" $1)

[ $res -ne 0 ] && echo "no YAML title in $1 - will need to fix"
[ $cnt -ne 2 ] && echo "no YAML delimiters --- in $1 - will need to fix"

[[ $res -eq 0 && $cnt -eq 2 ]] && echo "all good..nothing to do here" && exit 0

#Otherwise we need to YAML-ise the source .md files :-)
#first, copy aside original source .md file for safekeeping
cp $1 $1.raw ; stat=$?

[ $stat -ne 0 ] && echo "could not copy the source file $1 - please check" && exit 1

echo "---" >$YAMLHDR
echo "layout: default" >>$YAMLHDR
echo "markdown: 1" >>$YAMLHDR
echo "title: Fabric Composer - need to update this YAML header to real title " >>$YAMLHDR
echo "sidebar: sidebars/$2.md" >>$YAMLHDR
---
cp  $YAMLHDR $1  ; stat=$?  # 0 means it created a new file
[ $stat -ne 0 ] && echo "no initial YAML header copied to $1 - will need to fix" && exit 1

# now append the actual raw .md file to the header
cat $1.raw >> $1   ; stat=$?    # source .md file has a YAML header now
[ $stat -ne 0 ] && echo "no content was added to YAML header - will need to fix" && exit 1

echo File $1 done with YAML header processing

cd ${DIR}
