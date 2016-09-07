Node.js的安装及运行
=======

1. 下载nodejs

	```bash
	cd /usr/local
	wget --accept=gz --no-check-certificate  https://nodejs.org/dist/v4.2.4/node-v4.2.4-linux-x64.tar.gz
	```

2. 解压缩nodejs

	```bash
	tar zxvf node-v4.2.4-linux-x64.tar.gz
	```

3. 创建nodejs链接

	```bash
	ln -s /usr/local/node-v4.2.4-linux-x64/bin/node /usr/local/bin/node
	ln -s /usr/local/node-v4.2.4-linux-x64/bin/npm /usr/local/bin/npm
	```

4. 安装grunt-cli

	```bash
	npm install -g grunt-cli
	ln -s /usr/local/node-v4.2.4-linux-x64/bin/grunt /usr/local/bin/grunt
	```

5. 进入easycode-static-watcher所在目录，安装模块

	```bash
	cd /data/webroot/easycode-static-watcher
	npm install
	```

6. 启动脚本

	```bash
	./bin/startup.sh
	```
