/*
 *  @author WangXiaoJin
 */
module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('package.json'),
    	cssPaths = (function() {
	    	if(!pkg.cfg.cssPaths[0].baseDir) {
	    		//单个baseDir的配置
	    		return pkg.cfg.cssPaths;
	    	}else {
	    		//多个baseDir的配置
	    		var cssPaths = [];
	    		pkg.cfg.cssPaths.forEach(function(item) {
	    			if(item) {
	    				item.filePaths.forEach(function(ele) {
	    					if(ele) {
	    						cssPaths.push(ele);
	    					}
	    				});
	    			}
	    		});
	    		return cssPaths;
	    	}
	    })();
    grunt.initConfig({
        uglify: {
            batch: {
                files: (function(){
                    var files = [];
                    pkg.cfg.jsPaths.forEach(function(path) {
                        files.push({
                            expand: true,
                            cwd: path,          // 源文件base path
                            src: ['**/*.js', '!**/*.min.js'],   // 源文件
                            dest: path,         // 输出文件base path
                            ext: '.min.js',    // 新生成文件的后缀
                            extDot: 'last'      // 指定文件后缀符号从最后一个句号算起
                        });
                    });
                    return files;
                })()
            },
            one: {
                src: '<%= grunt.option("src") %>',
                dest: '<%= grunt.option("dest") %>'
            }
        },
        jshint: {
            beforeMin: (function(){
                var files = ['Gruntfile.js'];
                pkg.cfg.jsPaths.forEach(function(path) {
                    files.push(path + '/**/*.js');
                    files.push('!' + path + '/**/*.min.js');
                });
                return files;
            })(),
            afterMin: (function(){
                var files = [];
                pkg.cfg.jsPaths.forEach(function(path) {
                    files.push(path + '/**/*.min.js');
                });
                return files;
            })(),
            one: '<%= grunt.option("src") %>'
        },
        cssmin: {
            batch: {
                files: (function(){
                    var files = [];
                    cssPaths.forEach(function(path) {
                        files.push({
                            expand: true,
                            cwd: path,          // 源文件base path
                            src: ['**/*.url-css'],   // 源文件
                            dest: path,         // 输出文件base path
                            ext: '.min.css',    // 新生成文件的后缀
                            extDot: 'last'      // 指定文件后缀符号从最后一个句号算起
                        });
                    });
                    return files;
                })()
            },
            one: {
                src: '<%= grunt.option("src") %>',
                dest: '<%= grunt.option("dest") %>'
            }
        },
        cssurl: {
            options: (function() {
            	if(!pkg.cfg.cssPaths[0].baseDir) {
            		//单个baseDir的配置
            		return {
                        baseDir: pkg.cfg.baseDir,
                        basePaths: pkg.cfg.basePaths
                    };
            	}else {
            		//多个baseDir的配置
            		return {
            			multipleBases: pkg.cfg.cssPaths
        			};
            	}
            })(),
            batch: {
                files: (function(){
                    var files = [];
                    cssPaths.forEach(function(path) {
                        files.push({
                            expand: true,
                            cwd: path,          // 源文件base path
                            src: ['**/*.css', '!**/*.min.css'],   // 源文件
                            dest: path,         // 输出文件base path
                            ext: '.url-css',    // 新生成文件的后缀
                            extDot: 'last'      // 指定文件后缀符号从最后一个句号算起
                        });
                    });
                    return files;
                })()
            },
            one: {
                src: '<%= grunt.option("src") %>',
                dest: '<%= grunt.option("dest") %>'
            }
        },
        htmlmin: {
            options: {
                removeComments: true,
                minifyJS: true,
                minifyCSS: true,
                ignoreCustomFragments: [/<#[^>]*>/, /<\/#[^>]*>/, /<@[^>]*>/, /<\/@[^>]*>/], //忽略Freemarker的<#...>、<@...>
                collapseWhitespace: true //去除空格、换行符:根据情况开启与否
            },
            batch: {
                files: (function(){
                    var files = [];
                    pkg.cfg.htmlPaths.forEach(function(path) {
                        files.push({
                            expand: true,
                            cwd: path,          // 源文件base path
                            src: ['**/*.html'],   // 源文件
                            dest: path,         // 输出文件base path
                            ext: '.html',       // 新生成文件的后缀
                            extDot: 'last'      // 指定文件后缀符号从最后一个句号算起
                        });
                    });
                    return files;
                })()
            },
            one: {
                src: '<%= grunt.option("src") %>',
                dest: '<%= grunt.option("dest") %>'
            }
        },
        watch: {
            options: {
                event: ['added', 'changed']
            },
            //每修改文件一次，watch event的事件就会多触发一次：需要查明原因后再使用
            /*config: {
                files: [ 'Gruntfile.js', 'package.json' ],
                options: {
                    reload: true
                }
            },*/
            //因为监听的目录中既包含js文件又包含css文件，所有用两个target分别监听js、css时，新增文件或文件夹可能不会触发事件
            //注意：经测试win7系统下，在空文件夹下创建文件不会触发"added"事件。在centos系统下没问题。
            jsCss: {
                files: (function(){
                    var files = [],
                        paths = [].concat(pkg.cfg.jsPaths);
                    if(cssPaths && cssPaths.length > 0) {
                    	cssPaths.forEach(function (item) {
                            if(paths.indexOf(item) == -1) {
                                paths.push(item);
                            }
                        });
                    }
                    paths.forEach(function(path) {
                        files.push(path + '/**');
                        files.push('!' + path + '/**/*.{min.js,min.css,png,jpg,gif}');
                    });
                    return files;
                })(),
                tasks: ['newer:uglify:batch', 'newer:cssurl:batch', 'newer:cssmin:batch']
            }
        }
    });

    //输出进度日志
    grunt.event.on('watch', function(action, filepath, target) {
        grunt.log.ok("action:".concat(action, "  ----  filepath:",filepath, "  ----  target:" , target));
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadTasks('./tasks/cssurl');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-newer');
    /*下方为配置的常用 grunt 命令*/
    grunt.registerTask('default', ['watch']);

    grunt.task.registerTask('uglifyOne', '压缩单个JS文件', function(src, dest) {
        grunt.option("src", src);
        grunt.option("dest", dest);
        grunt.task.run("uglify:one");
    });
    grunt.task.registerTask('cssurlOne', '处理CSS文件中的URL', function(src, dest) {
        grunt.option("src", src);
        grunt.option("dest", dest);
        grunt.task.run("cssurl:one");
    });
    grunt.task.registerTask('cssminOne', '压缩单个CSS文件', function(src, dest) {
        grunt.option("src", src);
        grunt.option("dest", dest);
        grunt.task.run("cssmin:one");
    });

};
