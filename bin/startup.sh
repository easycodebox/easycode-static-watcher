#!/bin/sh
cd `dirname $0`
logs="../logs"

if [ ! -x "$logs" ]; then
	mkdir "$logs"
fi
nohup grunt --no-color >> $logs/info.`date +%F`.log 2>&1 &
echo "Easycode-Static-Watcher Started"
