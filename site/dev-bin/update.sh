#!/bin/bash

DIR="$( cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DIR=`dirname ${DIR}`

echo using upgrade dir $DIR
ln -f -s ${DIR} /home/gdusbabek/site
sudo ln -f -s ${DIR}/conf/nginx-site /etc/nginx/sites-enabled/genassist

# npm install
cd $DIR
npm install

#todo restart node.

sudo /etc/init.d/nginx restart

echo Successfully updated.