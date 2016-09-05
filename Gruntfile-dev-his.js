module.exports = function(grunt) {

    /**
     *  警告：此实例会有如下两个弊端
     *      1、copy整个目录到监听目录中，无论目录里包含什么文件，只会触发一次grunt.event.on('watch')事件。
     *      2、批量创建文件时，grunt.event.on('watch')事件会触发两次，但由于其内部机制，task可能只会执行一次。用如下方案能抵部分作用：
     *              var changedFiles = Object.create(null);
                    var onChange = grunt.util._.debounce(function() {
                      grunt.config('jshint.all.src', Object.keys(changedFiles));
                      changedFiles = Object.create(null);
                    }, 200);
                         grunt.event.on('watch', function(action, filepath) {
                      changedFiles[filepath] = action;
                      onChange();
                    });

     *  注：如经长期测试、使用，发现watch模块处理文件时遗漏了部分文件，则使用grunt-newer模块规避此问题。
     *  因为grunt-newer模块的设计思路是dest文件和src文件比较，如果src文件修改时间大于dest修改时间，则触发task。
     *  使用grunt-newer模块后编码更简单，但是大批量的比较文件也会消耗性能。
     */
    var pkg = grunt.file.readJSON('package.json');
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
                    pkg.cfg.cssPaths.forEach(function(path) {
                        files.push({
                            expand: true,
                            cwd: path,          // 源文件base path
                            src: ['**/*.css', '!**/*.min.css'],   // 源文件
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
                //atBegin: true, //运行该target时立即会触发执行其tasks属性里的任务
                //spawn: false,  //是否让tasks运行在子进程中，根据个人需求。因为需要上下文共享，所以关闭此功能。
                event: ['added', 'changed']
            },
            //没修改文件一次，watch event的事件就会多触发一次：需要查明原因后再使用
            /*config: {
                files: [ 'Gruntfile.js', 'package.json' ],
                options: {
                    reload: true
                }
            },*/
            js: {
                files: (function(){
                    var files = [];
                    pkg.cfg.jsPaths.forEach(function(path) {
                        files.push(path + '/**/*.js');
                        files.push('!' + path + '/**/*.min.js');
                    });
                    return files;
                })(),
                //spawn = false 时可以直接替换成下面注释的代码
                tasks: ['uglifyOne:<%= grunt.option("src") %>:<%= grunt.option("dest") %>']
                //tasks: ['uglify:one']
            },
            css: {
                files: (function(){
                    var files = [];
                    pkg.cfg.cssPaths.forEach(function(path) {
                        files.push(path + '/**/*.css');
                        files.push('!' + path + '/**/*.min.css');
                    });
                    return files;
                })(),
                //spawn = false 时可以直接替换成下面注释的代码
                tasks: ['cssminOne:<%= grunt.option("src") %>:<%= grunt.option("dest") %>']
                //tasks: ['cssmin:one']
            }
        }
    });

    //输出进度日志
    grunt.event.on('watch', function(action, filepath, target) {
        if(grunt.file.isFile(filepath) && (action === 'added' || action === 'changed') ) {
            //增加“.min”后缀
            var index = filepath.lastIndexOf('.'),
                postfix = filepath.substring(index + 1),
                dest = filepath.substring(0, index).concat('.min.', postfix);
            if((postfix = postfix.toLowerCase()) === 'js' || postfix === 'css') {
                grunt.option("src", filepath);
                grunt.option("dest", dest);
                return true;
            }
        }
        grunt.option("src", 'false');
        grunt.option("dest", 'false');
        return false;
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    /*下方为配置的常用 grunt 命令*/
    grunt.registerTask('default', ['htmlmin']);

    grunt.task.registerTask('uglifyOne', '压缩单个JS文件', function(src, dest) {
        if(src !== 'false' && dest !== 'false') {
            grunt.option("src", src);
            grunt.option("dest", dest);
            grunt.task.run("uglify:one");
        }
    });
    grunt.task.registerTask('cssminOne', '压缩单个CSS文件', function(src, dest) {
        if(src !== 'false' && dest !== 'false') {
            grunt.option("src", src);
            grunt.option("dest", dest);
            grunt.task.run("cssmin:one");
        }
    });

};
