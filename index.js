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
Resource.list = function(name){
  var args = [].slice.call(arguments,1)
    , last = args.slice(-1)[0]
    , fn = ('function' == typeof last ? args.pop() : refresh.bind(this))
    , params = {}
  for (var i=0;i<args.length;++i) merge(params,args[i]);
  var uri = this.resolvedLink(name,params);
  this.callService(uri, 'get', fn);
  return this;
}

Resource.add =
Resource.create = function(name,params,obj){
  if (arguments.length == 2) {
    obj = params; params = undefined;
  }
  var uri = this.resolvedLink(name,params);
  this.callService(uri, 'post', obj);
  return this;
}

Resource.update = function(name,params,obj){
  if (arguments.length == 2) {
    obj = params; params = undefined;
  }
  var uri = this.resolvedLink(name,params);
  this.callService(uri, 'put', obj);
  return this;
}
  
Resource.remove =
Resource.del = function(name,params){
  if (arguments.length == 0) {
    name = 'self';
  }
  var uri = this.resolvedLink(name,params);
  this.callService(uri, 'del');
  return this;
}

// TODO: error-handling callback defined in target class
Resource.callService = function(addr,verb,obj){
  var service = this.service
    , cb  // placeholder
  if (obj){
    service(addr)[verb](obj,cb);
  } else {
    service(addr)[verb](cb);
  }
}

/* 
 * Default read callback == reparse message and optionally emit 'refresh'
 * Note that parse() must be defined in target class
 *
 */
function refresh(res){
  this.parse(res);
  if (this.emit) this.emit('refresh');
}

// private

function merge(obj,from){
  for (var k in from) obj[k] = from[k];
  return obj;
}

var templates = {}   // cache URI templates across all resources


