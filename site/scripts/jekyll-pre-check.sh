#!/bin/bash

# Exit on first error, print all commands.

set -ev

# Grab the Concerto directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# TODIR here - is the same as working directory build-gh-pages.sh  - this does a final check on .md links and yaml headers plus menu setup tasks
export TODIR=${DIR}/temp/jekylldocs/

cd ${TODIR}

# Build the YAML .md files and replace inline .md links with .html prior to jekyll build
for dirname in overview start concepts tasks reference support
do

   #for each dir ; find source .md files ;  call script to YAML-ise them..
   #filename is created as the same name, ie post-Yaml-isation ie. its original name (.md)

   ls -a $dirname
   filelist=$(ls $dirname/*.md)
   for file in $filelist
   do
   # first menu options (in Yeoman template) become the menu link anchor (looks for index.html) - so as a jekyll process create an index file
	echo "$0: processing file $file ...."
	$DIR/scripts/check-source-md.sh $file $dirname # transform .md file, in 'this' dir
   done
   # onto the next directory in our list
done

# Finished YAML-ise - next,  build Jekyll site (.html output in _site)
# note: Jekyll source goes to 'develop' branch under subdir jekylldocs and
# _site web pages goes to 'gh-pages' branch (wwwroot / rootdir)
cd ${DIR}
