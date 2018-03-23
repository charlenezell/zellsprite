"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var sp = require("gulp.spritesmith");
// const ld = require("lodash");
var es = require("event-stream");
var glob = require("glob");
var imagemin = require("gulp-imagemin");
var rename = require('gulp-rename');
var path = require("path");
var chalk = require('chalk');
var buffer = require('vinyl-buffer');
var imageminPngquant = require('imagemin-pngquant');
var modulepath = __dirname;

function getRealName(w) {
    var a = w.split("/").pop();
    var realName = a.split("_").pop() + ".png";
    return realName;
}

function getParamList(_a) {
    /*v,h,s  默认用_分割，潜规则是图片命名不能有_*/
    var a = path.basename(_a);
    var arg = a.split("_");
    arg.pop();
    return arg;
}

function isInNameOrder(pathToCal) {
    var param = getParamList(path.basename(pathToCal));
    return param.includes("sbn");
}

function chooseAlgorithm(pathToCal) {
    var param = getParamList(path.basename(pathToCal));
    var g = [{
        name: "h",
        alg: "left-right"
    }, {
        name: "v",
        alg: "top-down"
    }, {
        name: "s",
        alg: "diagonal"
    }];
    var alg = "binary-tree",
        hit = false;
    g.forEach(function (v) {
        if (param.includes(v.name) && !hit) {
            hit = true, alg = v.alg;
        }
    });
    return alg;
}
var defaultOption = {
    src: "./style/r_imgSrc/",
    dest: "./style/r_imgDest/",
    taskName: "sprite",
    templateFile: path.join(modulepath, "./sptemplate.hb")
};

function main(gulp) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var config = _extends({}, defaultOption, options);
    var configInfo = Object.keys(config).map(function (k) {
        return "using " + k + "=" + config[k];
    }).join("\n");
    console.log(chalk.bgGreen.red(configInfo));
    var dest = config.dest,
        src = config.src,
        taskName = config.taskName,
        _config$destBaseOn = config.destBaseOn,
        destBaseOn = _config$destBaseOn === undefined ? "" : _config$destBaseOn,
        templateFile = config.templateFile,
        _config$fileExt = config.fileExt,
        fileExt = _config$fileExt === undefined ? ".scss" : _config$fileExt;

    gulp.task(taskName, function () {
        var jobs = [];
        var spriteGlob = path.join(src, "*"); //图片目录的直接子项作为sprite图片的名字
        var _dest = path.join(dest);
        var cssBundles = [];
        var _map = glob.sync(spriteGlob).map(function (a) {
            var imgName = getRealName(a),
                imgName2 = getParamList(a).includes("jpeg") ? imgName.replace(path.extname(imgName), ".jpeg") : imgName,
                cssName = path.basename(a) + fileExt,
                allImgGlob = path.join(a, "**/*.{jpg,png}");
            imgName2 = getParamList(a).includes("jpg") ? imgName.replace(path.extname(imgName), ".jpg") : imgName;
            var spMixStream = gulp.src(allImgGlob, {
                read: false
            }).pipe(sp({
                imgName: imgName2,
                cssName: cssName,
                engine: "gmsmith",
                imgPath: path.posix.join(dest.replace(destBaseOn, ""), imgName2),
                algorithm: chooseAlgorithm(a),
                algorithmOpts: {
                    sort: !isInNameOrder(a)
                },
                padding: 5,
                imgOpts: {
                    quality: 100
                },
                cssVarMap: function cssVarMap(sp) {
                    var spriteImgName = getRealName(a);
                    sp.name = spriteImgName.replace(path.extname(spriteImgName), "") + "_" + sp.name;
                },
                cssTemplate: templateFile
            }));

            cssBundles.extraData = {
                basePath: "./"
            };

            cssBundles.push(spMixStream.css);
            var b = getParamList(a);
            var needP8Renderer = b.includes("p8");
            var hasOptimised = b.includes("jpeg") || b.includes("jpg");
            if (needP8Renderer) {
                return spMixStream.img.pipe(buffer()).pipe(imagemin([imageminPngquant()])).pipe(gulp.dest(_dest));
            } else if (hasOptimised) {
                return spMixStream.img.pipe(gulp.dest(_dest));
            } else {
                return spMixStream.img.pipe(buffer()).pipe(imagemin({
                    optimizationLevel: 3
                })).pipe(gulp.dest(_dest));
            }
        });
        var imgJob = es.concat.apply(null, _map);

        if (_map.length > 0) {
            jobs.push(imgJob);
        }
        cssBundles.forEach(function (v) {
            jobs.push(v.pipe(rename(function (path) {
                path.basename = "_" + getRealName(path.basename);
            })).pipe(gulp.dest(_dest)));
        });
        if (jobs.length > 0) {
            return es.concat.apply(this, jobs);
        }
    });
}

exports.default = main;