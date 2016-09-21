/*
 * 处理CSS文件中的url地址，把相对路径换成绝对路径
 * @author WangXiaoJin
 */
var path = require("path");
var async = require('async');
var cssurl = require("./lib/css-url").init();

module.exports = function(grunt) {
  "use strict";

  grunt.registerMultiTask("cssurl", "process urls in css file.", function() {
    var asyncFunc = this.async(),
        opts = this.options();

    async.each(this.files, function(file, callback) {
      var files = file.src.filter(function(filepath) {
        //删除不存在的文件
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      });
      async.map(files, function(filepath, callback) {
        var newOpt;
		//多个baseDir的配置，则解析成相对应的baseDir
		START:
		for(var i = 0; i < opts.allOpts.length; i++) {
			for(var j = 0; j < opts.allOpts[i].filePaths.length; j++) {
				if(filepath.endsWith(path.relative(opts.allOpts[i].filePaths[j], filepath))) {
					newOpt = opts.allOpts[i];
					break START;
				}
			}
		}
        //处理CSS文件
        if (newOpt) {
        	cssurl.cssurl(filepath, newOpt, callback);
        }
      }, function(err, results) {
        if(err) throw err;
        callback();
        //处理后的内容写入文件
        grunt.file.write(file.dest, results.join('\n'));
        grunt.log.writeln('The cssurl task process successfully. File "' + file.dest + '" modefied.');
      });
    }, function(err) {
      if(err) throw err;
      asyncFunc();
    });
  });

  /*grunt.registerMultiTask("cssurl", "process urls in css file.", function() {
    var asyncFunc = this.async(),
        opts = this.options(),
        length = this.files.length;

    if(length === 0) {
      asyncFunc();
    }else {
      this.files.forEach(function(file) {
        var files = file.src.filter(function(filepath) {
          //删除不存在的文件
          if (!grunt.file.exists(filepath)) {
            grunt.log.warn('Source file "' + filepath + '" not found.');
            return false;
          } else {
            return true;
          }
        });
        var fileNum = files.length;
        if(fileNum.length === 0) {
          if (--length === 0) {
            asyncFunc();
          }
        }else {
          var contents = files.map(function(filepath) {
            //处理CSS文件
            return cssurl.cssurl(filepath, opts, function(){
              if (--fileNum === 0 && --length === 0) {
                asyncFunc();
              }
            });
          }).join('\n');

          //处理后的内容写入文件
          grunt.file.write(file.dest, contents);
          grunt.log.writeln('The cssurl task process successfully. File "' + file.dest + '" modefied.');
        }
      });
    }
  });*/
};
