#easycode-static-watcher

easycode-static-watcher的功能在于监控服务器端的JS/CSS的文件，当有文件改变时自动重新生成对应的压缩(min)文件。

为了会出现这种需求呢？正常情况下是前端写的JS/CSS文件，自己手动压缩成min文件，然后再上传至服务器或集成进项目中，其他人员不需要管任何前端的JS/CSS源文件，能见到的就只有min文件。在这样的情况下任何人想在运行中的项目进行JS调试时会发现根本就调试不了，因为只有min文件。还有一个情况经常会发生，就是前端人员修改了源文件，却忘了生成min文件，然后直接把旧的min文件直接交给其他人员或者传至服务端。

鉴于上面的问题，我想到了一个解决方案，那就是前端只需要提供JS/CSS源文件，min文件直接由服务器生成，项目中可以直接配置使用源文件还是压缩文件，这样就增加灵活度。这样别人既能看到源文件也能看到压缩文件，可以通过源文件来调试，通过压缩文件来加快响应速度。

> easycode-static-watcher中的[css-url.js](./tasks/cssurl)组件是最灵活的处理css文件中url路径的组件，提供了各种配置，这个组件是我2016/02实现的，当时网上搜了所有的相关组件，发现功能太单一了。`css-url`提供了图片转成base64数据、包含/排除指定规则的url、为url生成绝对路径地址（合并CSS必须要此功能，不然不能准确定位到图片）、为url增加的绝对路径提供多域名配置（如：['//static1.xxx.com/', '//static2.xxx.com/']，这样设计是为了缓解静态资源服务器压力）等 各种功能配置。

> 注：`easycode-static-watcher`在win7系统有一个问题，那就是当监听的文件夹为空时，这时你往这个空文件夹中新增JS/CSS文件，并不会生成min文件。解决方案是不要存在空文件夹，至少包含一个JS/CSS文件。在Linux系统中没有此问题。

##easycode-static-watcher的安装及运行

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
