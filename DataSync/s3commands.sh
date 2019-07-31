#!/bin/bash
#source where commands are fetched
sourcebucket=$1
echo using souce bucket to fetch commands ${sourcebucket}
aws s3 cp s3://${sourcebucket}/commands.sh .
sh commands.sh


