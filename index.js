'use strict';

/**
 * Module dependencies
 */

var through = require('through2');
var gutil = require('gulp-util');
var jade = require('jade');

/**
 * Sub modules
 */

var compile = jade.compile;
var compileClient = jade.compileClient;
var ext = gutil.replaceExtension;
var PluginError = gutil.PluginError;

function handleCompile(contents, opts){
  if (opts.client){
    var compiled = compileClient(contents, opts);
    if (opts.exports) {
      opts.modulename = opts.modulename || 'jade';
      var req_jade = "var jade = require('" + opts.modulename + "');\n";

      var comment = '\n\n/**\n';
      comment +=    ' * Export module\n';
      comment +=    ' */\n';

      compiled = req_jade + compiled + comment;
      compiled += "\nmodule.exports = template;";
    }
    return compiled;
  }

  return compile(contents, opts)(opts.locals || opts.data);
}

function handleExtension(filepath, opts){
  if(opts.client){
    return ext(filepath, '.js');
  }

  return ext(filepath, '.html');
}

/**
 * Expose module
 *
 * @param {Object} options
 * @api public
 */

module.exports = function(options){
  var opts = options || {};

  function CompileJade(file, enc, cb){
    opts.filename = file.path;
    file.path = handleExtension(file.path, opts);

    if(file.isStream()){
      this.emit('error', new PluginError('gulp-jade', 'Streaming not supported'));
      return cb();
    }

    if(file.isBuffer()){
      try {
        file.contents = new Buffer(handleCompile(String(file.contents), opts));
      } catch(e) {
        this.emit('error', e);
      }
    }

    this.push(file);
    cb();
  }

  return through.obj(CompileJade);
};
