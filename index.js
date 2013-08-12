
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

// TODO: implied name = 'self' if arguments.length < 2 ?
Resource.read =
Resource.list = function(name,fn){
  this.addCommand(this.links[name], 'get', fn);
  return this;
}

Resource.add =
Resource.create = function(name,obj){
  this.addCommand(this.links[name], 'post', obj);
  return this;
}

Resource.update = function(name,obj){
  this.addCommand(this.links[name], 'put', obj);
  return this;
}
  
Resource.del = function(name,obj){
  this.addCommand(this.links[name], 'del', obj);
  return this;
}

Resource.addCommand = function(addr,verb,obj){
  var service = this.service;
  this.commands.push( function(cb){
    service(addr)[verb](obj,cb);
  });
}

Resource.commit = function(cb){
  var cmds = this.commands;
  while (cmds.length){
    cmds.shift()(cb);
  }
}
