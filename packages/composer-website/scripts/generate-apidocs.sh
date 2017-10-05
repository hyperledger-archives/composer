#!/bin/bash
# Exit on first error, print all commands.
set -ev

# Grab the Composer directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
INDEX=1200

for file in ${DIR}/../composer-client/lib/*.js
do
  echo "${file}"
  BASENAME="$(basename ${file})"
  ((INDEX++))

  FILENAME=${DIR}/jekylldocs/api-doc/${BASENAME}.md

  cat ${DIR}/scripts/header.tpl | sed "s/{{TITLE}}/Client ${BASENAME}/g" |  sed "s/{{SECTION}}/api/g" | sed "s/{{INDEXORDER}}/${INDEX}/g" > "${FILENAME}"
  documentation build "${file}" --markdown-toc=true  -f md >> "${FILENAME}"
done

for file in ${DIR}/../composer-admin/lib/*.js
do
  echo "${file}"
  BASENAME="$(basename ${file})"
  ((INDEX++))

  FILENAME=${DIR}/jekylldocs/api-doc/${BASENAME}.md

  cat ${DIR}/scripts/header.tpl | sed "s/{{TITLE}}/Admin ${BASENAME}/g" |  sed "s/{{SECTION}}/api/g" | sed "s/{{INDEXORDER}}/${INDEX}/g" > "${FILENAME}"
  documentation build "${file}" --markdown-toc=true  -f md >> "${FILENAME}"
done

for file in ${DIR}/../composer-runtime/lib/api/*.js
do
  echo "${file}"
  BASENAME="$(basename ${file})"
  ((INDEX++))

  FILENAME=${DIR}/jekylldocs/api-doc/${BASENAME}.md

  cat ${DIR}/scripts/header.tpl | sed "s/{{TITLE}}/Runtime ${BASENAME}/g" |  sed "s/{{SECTION}}/api/g"  | sed "s/{{INDEXORDER}}/${INDEX}/g" > "${FILENAME}"
  documentation build "${file}" --markdown-toc=true  -f md >> "${FILENAME}"
done

