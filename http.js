//TODO: remove superagent dep, just use straight xhr
//TODO: move this to another repo

var request = require('superagent')

module.exports = Service;

function Service(addr,opts){
  if (!(this instanceof Service)) return new Service(addr,opts);
  this.target = addr;
  this.opts = opts || {};
  return this;
}

Service.prototype.get = function(parse,handle){
  var req = request.get(this.target)
  applyOptions.call(this,req);
  req.end( 
    function(res){
      handle(res);
      parse(res);
    }
  );
}

Service.prototype.options = function(parse,handle){
  var req = new request.Request('OPTIONS', this.target)
  applyOptions.call(this,req);
  req.end( 
    function(res){
      handle(res);
      parse(res);
    }
  );
}

Service.prototype.post = function(obj,handle){
  var req = request.post(this.target)
  applyOptions.call(this,req);
  req.send(obj)
     .end(handle);
}

Service.prototype.put = function(obj,handle){
  var req = request.put(this.target)
  applyOptions.call(this,req);
  req.send(obj)
     .end(handle);
}

Service.prototype.del = function(handle){
  var req = request.del(this.target)
  applyOptions.call(this,req);
  req.end(handle);
}


// private

function applyOptions(req){
  var opts = {}
  merge(opts, defaultOptions[req.method]);
  merge(opts, this.opts['*'] || {});
  merge(opts, this.opts[req.method] || {});
  for (var meth in opts) req[meth](opts[meth]);
  return req;
}

var defaultOptions = {
  'GET':     { type: 'application/json' },
  'OPTIONS': { type: 'application/json' },
  'POST':    { type: 'application/json' },
  'PUT':     { type: 'application/json' },
  'DELETE':  { }
}


function merge(obj,from){
  for (var k in from) obj[k] = from[k];
  return obj;
}
