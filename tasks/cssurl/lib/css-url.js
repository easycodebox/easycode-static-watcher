/*
 *  css文件中url转换成绝对路径或base64格式
 *  @author WangXiaoJin
 */
'use strict';
// Node libs
var fs = require("fs");
var path = require("path");
var util= require('util');
var urlUtil = require("url");
var assert = require('assert');

var request = require('request');
var units = require('node-units');
var mime = require("mime");
var async = require('async');

var options = {
      baseDir: process.cwd(), //css文件出现绝对路径时（以单个 "/" 开头的url），基路径地址。类似于"http://www.xxx.com" == "/data/web/xxx"
      stripParams: false, //删除url地址后的参数
      include: null,  //返回true则处理此url。格式：function(url) { return true; }
      exclude: null,  //返回true则不处理此url。格式：function(url) { return true; }

      /*************     url处理成绝对路径配置    *****************/
      abs: true,     //开启绝对路径模式（absolute）
      skipAbsKey: "skipAbs", //当次key出现在url参数中，且值为true或非0时，则此url不会被转成绝对路径
      basePaths: [],      //绝对路径的前缀，当有多个值时，urls轮流使用。例：['//static1.xxx.com/', '//static2.xxx.com/']
      absInclude: null,  //返回true则处理此url。格式：function(url) { return true; }
      absExclude: null,  //返回true则不处理此url。格式：function(url) { return true; }
      verifyExist: true,  //校验指定url文件是否存在，不存在则抛出异常
      skipHttpVerifyExist: true, //跳过外部HTTP链接的校验

      /*************     处理成base64配置    *****************/
      base64: false,      //图片是否转换成base64格式
      skipBase64Key: "skipBase64",  //当次key出现在url参数中，且值为true或非0时，则此url不会被转成base64格式
      base64SkipExternal: true,//图片转换成base64格式时是否跳过外部链接的图片 - 当base64开启时此参数才有效
      maxSize: null,    //超出指定值时忽略img或font，不转成base64格式。例：'5 MB', '30 KB', '300 B'
      base64Include: null,  //返回true则处理此url。格式：function(url) { return true; }
      base64Exclude: null,  //返回true则不处理此url。格式：function(url) { return true; }

    },
    urlExp = /(@import\s+(?:url\(\s*)?['"]?)([^'"\)]+)|(url\(\s*['"]?)([^'"\)]+)/ig;

exports.init = function() {
  var exports = {};

  /**
   * 判断路径是否是相对路径
   * @param url
   */
  exports.isRelative = function(url) {
    if(url == null || (url = String(url)).trim() == "")
      throw new Error("The path param must not be blank.");
    return !( /^(https?:|\/|data:)/i.test(url) || path.isAbsolute(url) );
  };

  /**
   * 判断是否是简写CDN地址。例：//cdn.xxx.com/a.img
   * @param url
   */
  exports.isCDN = function(url) {
    if(url == null || (url = String(url)).trim() == "")
      throw new Error("The url param must not be blank.");
    return url.startsWith("//");
  };

  /**
   * 判断是否是http请求。包括：http、https、常用CDN格式
   * @param url
   */
  exports.isHttp = function(url) {
    if(url == null || (url = String(url)).trim() == "")
      throw new Error("The url param must not be blank.");
    return /^(https?:|\/\/|data:)/i.test(url);
  };

  /**
   * 判断地址是否为base64格式。如：url("data:image/gif;base64,xxxxx")
   * @param url
   */
  exports.isBase64Data = function(url) {
    if(url == null || (url = String(url)).trim() == "")
      throw new Error("The url param must not be blank.");
    return url.startsWith("data:");
  };

  /**
   * 处理css文件中的url
   * @param srcFile Relative or absolute path to a source css file.
   * @param opts Options object
   * @param callback  callback(err, transformed)
   */
  exports.cssurl = function(srcFile, opts, callback) {
    if(typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = util._extend(options, opts);
    if(!Array.isArray(opts.basePaths)) {
      assert(opts.basePaths != null, "The param of basePaths can not be null.");
      opts.basePaths = [opts.basePaths];
    }
    assert(opts.basePaths.length > 0, "The param of basePaths can not be empty.");

    var src = fs.readFileSync(srcFile, 'utf8');
    var skipAbsReg = new RegExp("[\\?&]" + opts.skipAbsKey + "=\\s*(true|1)"),
        skipBase64Reg = new RegExp("[\\?&]" + opts.skipBase64Key + "=\\s*(true|1)"),
        fileCache = {},   //key => 文件名；value => 1.true 表示文件存在 2. 文件的数据 {mimeType: "xx", data: "xxx"，size: 1456}
        httpTasks = [],   //待执行的http tasks
        basePathIndex = 0;

    /**
     * 获取basePath
     */
    var getBasePath = function() {
      return basePathIndex < opts.basePaths.length ? opts.basePaths[basePathIndex++] : opts.basePaths[basePathIndex = 0];
    };
    /**
     * 删除url地址中的参数
     * @param url
     * @returns {string}
     */
    var stripUrlParams = function (url) {
      return url.indexOf("?") < 0 ? url : url.substring(0, url.indexOf("?"));
    };
    /**
     * 判断url对应的内容是否存在，不存在则抛异常
     * @param url
     */
    var verifyFileExist = function (url) {
      if(opts.verifyExist) {
        if(fileCache[url]) return true;
        if(exports.isHttp(url)) {
          if(!opts.skipHttpVerifyExist) {
            httpTasks.push(function(callback) {
              request(exports.isCDN(url) ? 'http:' + url : url, function (err, response, body) {
                if (!err && response.statusCode == 200) {
                  fileCache[url] = true;
                }else if(!err) {
                  err = "Verify file " + url + " exist error.";
                }
                callback(err);
              });
            });
          }
        }else {
          assert(fs.existsSync(stripUrlParams(url)), "The file " + url + " not exist.");
        }
      }
    };

    /**
     * data转换成base64的url格式
     * @param mimeType
     * @param base64Data
     */
    var convertBase64Format = function (mimeType, base64Data) {
      return 'data:' + mimeType + ';base64,' + base64Data;
    };

    src = src.replace(urlExp, function(match, importSyntax, importData, urlSyntax, urlData) {
      var syntax = importSyntax || urlSyntax,
          url = (importData || urlData).trim();

      if(!exports.isBase64Data(url)
            && (!opts.include || opts.include(url))
            && (!opts.exclude || !opts.exclude(url))) {
        //处理成base64格式
        if (opts.base64
            && (!opts.base64Include || opts.base64Include(url))
            && (!opts.base64Exclude || !opts.base64Exclude(url))
            && !skipBase64Reg.test(url)
            && (!opts.base64SkipExternal || !exports.isHttp(url))) {
          if(exports.isRelative(url)) {
            url = path.join(path.dirname(srcFile), url);
            if(!path.isAbsolute(url)) {
              //相对路径转成绝对路径
              url = path.join(process.cwd(), url);
            }
          }else if(url.startsWith("/") && !exports.isCDN(url)) {
            url = path.join(opts.baseDir, url);
          }
          if(fileCache[url] && fileCache[url] !== true) {
            if(opts.maxSize && fileCache[url].size > units.convert(opts.maxSize + ' to B')) {
              console.log("File " + url + " is greater than " + opts.maxSize);
            }else {
              return syntax + convertBase64Format(fileCache[url].mimeType, fileCache[url].data);
            }
          }else {
            if(exports.isHttp(url)) {
              httpTasks.push(function(callback) {
                request({url: exports.isCDN(url) ? 'http:' + url : url, encoding: null }, function (err, response, body) {
                  if (!err && response.statusCode == 200) {
                    var urlObj = {
                          mimeType: mime.lookup(stripUrlParams(url)),
                          size: body.length
                        };
                    if(!opts.maxSize || body.length <= units.convert(opts.maxSize + ' to B')) {
                      urlObj.data = body.toString('base64');
                    }
                    fileCache[url] = urlObj;
                  }else if(!err) {
                    err = "Get file " + url + " error.";
                  }
                  callback(err, url);
                });
              });
              return syntax + url;
            }else {
              var fileSize = fs.statSync(stripUrlParams(url))['size'];
              if(opts.maxSize && fileSize > units.convert(opts.maxSize + ' to B')) {
                console.log("File " + url + " is greater than " + opts.maxSize);
              }else {
                var content = fs.readFileSync(stripUrlParams(url));
                fileCache[url] = {
                  mimeType: mime.lookup(stripUrlParams(url)),
                  data: content.toString('base64'),
                  size: fileSize
                };
                return syntax + convertBase64Format(fileCache[url].mimeType, fileCache[url].data);
              }
            }
          }
        }
        //处理成绝对路径
        if(opts.abs
            && (!opts.absInclude || opts.absInclude(url))
            && (!opts.absExclude || !opts.absExclude(url))
            && !skipAbsReg.test(url)) {
          //处理URL地址
          if(exports.isRelative(url)) {
            url = path.join(path.dirname(srcFile), url);
            if(!path.isAbsolute(url)) {
              //相对路径转成绝对路径
              url = path.join(process.cwd(), url);
            }
            //验证文件是否存在
            verifyFileExist(url);
            //删除url的参数
            url = opts.stripParams ? stripUrlParams(url) : url;
            //绝对路径转换成http请求
            return syntax + urlUtil.resolve(getBasePath(), path.relative(opts.baseDir, url));
          }else if(url.startsWith("/") && !exports.isCDN(url)) {
            //验证文件是否存在
            verifyFileExist(path.join(opts.baseDir, url));
            //删除url的参数
            url = opts.stripParams ? stripUrlParams(url) : url;
            //非CDN的绝对路径：/imgs/xxx.jpg ==> http://www.xxx.com/imgs/xxx.jpg
            return syntax + urlUtil.resolve(getBasePath(), url);
          }else {
            //http文件验证是否存在
            verifyFileExist(url);
            //删除url的参数
            url = opts.stripParams ? stripUrlParams(url) : url;
            return syntax + url;
          }
        }
      }
      return match;
    });

    //处理异步请求
    async.series(httpTasks, function (err, results) {
      if(err) throw err;
      results.forEach(function(item) {
        if(item) {
          src = src.replace(item, convertBase64Format(fileCache[item].mimeType, fileCache[item].data));
        }
      });
      callback(null, src);
    });

  };

  return exports;
};
