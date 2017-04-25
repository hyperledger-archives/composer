#!/bin/bash -eu

##################################################
# This script pulls docker images from hyperledger
# docker hub repository and Tag it as
# hyperledger/fabric-<image> latest tag
##################################################

dockerFabricPull() {
  local FABRIC_TAG=$1
  for IMAGES in peer orderer couchdb ccenv javaenv kafka zookeeper; do
      echo "==> FABRIC IMAGE: $IMAGES with tag $FABRIC_TAG"
      echo
      docker pull rameshthoomu/fabric-$IMAGES-x86_64:$FABRIC_TAG
      docker tag rameshthoomu/fabric-$IMAGES-x86_64:$FABRIC_TAG hyperledger/fabric-$IMAGES-x86_64
  done
    docker tag hyperledger/fabric-ccenv-x86_64:latest hyperledger/fabric-ccenv:x86_64-$(docker inspect hyperledger/fabric-peer-x86_64:latest | grep org.hyperledger.fabric.version | cut -d \" -f4 | tail -1)

}

dockerCaPull() {
      local CA_TAG=$1
      echo "==> FABRIC CA IMAGE with tag $CA_TAG"
      echo
      docker pull rameshthoomu/fabric-ca-x86_64:$CA_TAG
      docker tag rameshthoomu/fabric-ca-x86_64:$CA_TAG hyperledger/fabric-ca-x86_64
}
usage() {
      echo "Description "
      echo
      echo "Pulls docker images from hyperledger dockerhub repository"
      echo "tag as hyperledger/fabric-<image>:latest"
      echo
      echo "USAGE: "
      echo
      echo "./download-dockerimages.sh [-c <fabric-ca tag>] [-f <fabric tag>]"
      echo "      -c fabric-ca docker image tag"
      echo "      -f fabric docker image tag"
      echo
      echo
      echo "EXAMPLE:"
      echo "./download-dockerimages.sh -c x86_64-1.0.0-alpha -f x86_64-1.0.0-alpha"
      echo
      echo "By default, pulls fabric-ca and fabric 1.0.0-alpha docker images"
      echo "from hyperledger dockerhub"
      exit 0
}

while getopts "\?hc:f:" opt; do
  case "$opt" in
     c) CA_TAG="$OPTARG"
        echo "Pull CA IMAGES"
        ;;

     f) FABRIC_TAG="$OPTARG"
        echo "Pull FABRIC TAG"
        ;;
     \?|h) usage
        echo "Print Usage"
        ;;
  esac
done

: ${CA_TAG:="x86_64-1.0.0-alpha"}
: ${FABRIC_TAG:="x86_64-1.0.0-alpha"}

echo "===> Pulling fabric Images"
dockerFabricPull ${FABRIC_TAG}

echo "===> Pulling fabric ca Image"
dockerCaPull ${CA_TAG}
echo

echo "retagging ccenv"
docker tag hyperledger/fabric-ccenv-x86_64:latest hyperledger/fabric-ccenv:x86_64-$(docker inspect hyperledger/fabric-peer-x86_64:latest | grep org.hyperledger.fabric.version | cut -d \" -f4 | tail -1)
echo

echo "===> List out hyperledger docker images"
docker images | grep hyperledger*

