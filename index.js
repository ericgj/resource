var uritemplate = require('uritemplate')
  , noop = function(){}

module.exports = Resource;

function Resource(proto) {
  var self = Resource;
  for (k in self){
    proto[k] = self[k];
  }
}

Resource.entity = function(meth,klass){
  return this.expose(meth, function(obj){ return new klass(obj); });
}

Resource.collection = function(meth,klass){
  var Collection = 
    (Resource.Collection = Resource.Collection || require('collection'))
  return this.expose(meth, function(arr){
    return new Collection(arr).map(function(obj){ 
      return new klass(obj); 
    });
  });
}

Resource.expose = function(meth, cast){
  this[meth] = function(){
    return (cast ? cast(this.entities[meth]) : this.entities[meth]);
  }
  return this;
}

Resource.resolvedLink = function(name,data){
  var path = this.links[name]
  if (data){
    var t = templates[path] || uritemplate.parse(path);
    templates[path] = t;
    path = t.expand(data);
  }
  return path;
}

Resource.read =
Resource.list = function(name,params,fn){
  if (arguments.length == 0) {
    fn = noop; params = undefined; name = 'self';
  }
  if (arguments.length == 1) {
    fn = name; params = undefined; name = 'self';
  }
  if (arguments.length == 2) {
    fn = params; params = undefined;
  }
  var uri = this.resolvedLink(name,params);
  this.addCommand(uri, 'get', fn);
  return this;
}

Resource.add =
Resource.create = function(name,params,obj){
  if (arguments.length == 2) {
    obj = params; params = undefined;
  }
  var uri = this.resolvedLink(name,params);
  this.addCommand(uri, 'post', obj);
  return this;
}

Resource.update = function(name,params,obj){
  if (arguments.length == 2) {
    obj = params; params = undefined;
  }
  var uri = this.resolvedLink(name,params);
  this.addCommand(uri, 'put', obj);
  return this;
}
  
Resource.remove =
Resource.del = function(name,params){
  if (arguments.length == 0) {
    name = 'self';
  }
  var uri = this.resolvedLink(name,params);
  this.addCommand(uri, 'del');
  return this;
}

Resource.addCommand = function(addr,verb,obj){
  var service = this.service;
  this.commands.push( function(cb){
    if (obj){
      service(addr)[verb](obj,cb);
    } else {
      service(addr)[verb](cb);
    }
  });
}

Resource.commit = function(cb){
  var cmds = this.commands;
  while (cmds.length){
    cmds.shift()(cb);
  }
}

// private

var templates = {}   // cache URI templates across all resources


