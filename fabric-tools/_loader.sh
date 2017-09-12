echo "Development only script for Hyplerledger Fabric control"


# Grab the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
THIS_SCRIPT=`basename "$0"`
echo "Running '${THIS_SCRIPT}'"


if [ -z ${FABRIC_VERSION+x} ]; then
 echo "FABRIC_VERSION is unset, assuming hlfv1"
 export FABRIC_VERSION="hlfv1"
else
 echo "FABRIC_VERSION is set to '$FABRIC_VERSION'"
fi


if [ -z ${FABRIC_START_TIMEOUT+x} ]; then
 echo "FABRIC_START_TIMEOUT is unset, assuming 15 (seconds)"
 export FABRIC_START_TIMEOUT=15
else

   re='^[0-9]+$'
   if ! [[ $FABRIC_START_TIMEOUT =~ $re ]] ; then
      echo "FABRIC_START_TIMEOUT: Not a number" >&2; exit 1
   fi

 echo "FABRIC_START_TIMEOUT is set to '$FABRIC_START_TIMEOUT'"
fi

"${DIR}"/fabric-scripts/"${FABRIC_VERSION}"/"${THIS_SCRIPT}"
