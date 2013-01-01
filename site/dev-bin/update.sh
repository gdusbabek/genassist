#!/bin/bash

DIR="$( cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DIR=`dirname ${DIR}`

echo using upgrade dir $DIR
ln -f -s ${DIR} /home/gdusbabek/site
sudo cp ${DIR}/conf/nginx-site /etc/nginx/sites-available/genassist
sudo ln -f -s /etc/nginx/sites-available/genassist /etc/nginx/sites-enabled/genassist

# npm install
cd $DIR
npm install

# node and nginx
sudo stop genassist
sudo touch /var/log/genassist-node.log
sudo cp ${DIR}/conf/upstart-genassist /etc/init/genassist.conf
sudo start genassist

# chowning
sudo chown -r node ${DIR}
sudo chown node /var/log/genassist-node.log

sudo /etc/init.d/nginx restart


echo Successfully updated.