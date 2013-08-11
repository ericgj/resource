var has = Object.hasOwnProperty;

module.exports = Resource;

function Resource(proto) {
  var self = Resource;
  for (k in self){
    if (has.call(self,k)) proto[k] = self[k];
  }
}

// TODO: casting, e.g. this.expose('foo', function(f){ return new Foo(f)})
//       and shortcuts, e.g. this.entity('foo', Foo);  this.collection('bar', Bar);
Resource.expose = function(meth){
  this[meth] = function(){
    return this.entities[meth];
  }
  return this;
}

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
