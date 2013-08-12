
var request = require('superagent')

module.exports = Service;

function Service(addr){
  if (!(this instanceof Service)) return new Service(addr);
  this.target = addr;
  request.type('application/json');
  return this;
}

Service.prototype.get = function(parse,handle){
  request.get(this.target)
         .end( 
    function(res){
      handle(res);
      parse(res);
    }
  );
}

Service.prototype.post = function(obj,handle){
  request.post(this.target)
         .send(obj)
         .end(handle);
}

Service.prototype.put = function(obj,handle){
  request.put(this.target)
         .send(obj)
         .end(handle)
}

Service.prototype.del = function(handle){
  request.del(this.target).end(handle);
}

