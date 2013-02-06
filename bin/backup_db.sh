#!/bin/bash

# gets run as node user.
# bin/backup_db.sh /tmp/genassist/gen.db /tmp/backups 5

STAMP=`date '+%Y%m%d_%H%M%S'`
DB=$1
BACKUP_DIR=$2
KEEP=$3

mkdir -p $BACKUP_DIR
tar -cvzf $BACKUP_DIR/$STAMP.tgz $DB
#chown node $BACKUP_DIR/$STAMP.tgz
cd $BACKUP_DIR
(ls -t $BACKUP_DIR|head -n $KEEP;ls $BACKUP_DIR) | sort | uniq -u | xargs rm