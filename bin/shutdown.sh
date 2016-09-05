#!/bin/sh
ps -ef | sed -n '/grunt/{/grep/!p;}' | awk '{print$2}' | xargs -i kill {}
echo "Easycode-Static-Watcher Stopped"
