var Resource = require('resource')
  , http = require('resource/http')
  , Emitter = require('component-emitter')
  , request = require('visionmedia-superagent')
  , assert = require('component-assert')

function API(service){
  if (!(this instanceof API)) return new API(service);
  this.links = {};
  this.entities = {};
  if (service) this.setService(service);
  return this;
}

API.prototype.parse = function(message){
  if (message.links) {
    for (var link in message.links) this.links[link] = message.links[link];
  }
  return this;
}

API.prototype.setService = function(service,opts,cb){
  this.service = service;
  if (opts) this.serviceOptions = opts;
  if (cb) this.serviceHandler = cb;
  return this;
}

Resource(API.prototype);
Emitter(API.prototype);



function StudentResource(service){
  if (!(this instanceof StudentResource)) return new StudentResource(service);
  if (service) this.setService(service);
  this.links = {};
  this.entities = {};
  return this;
}

// tedious, need xpath/selector style helpers
StudentResource.prototype.parse = function(message){

  if (message.links) {
    for (var link in message.links) this.links[link] = message.links[link];
  }
  
  this.entities.students = [];
  
  if (message.students) {
    for (var i=0;i<message.students.length;++i){
      var student = message.students[i];
      var st = {};
      for (var prop in student) {
        st[prop] = student[prop];
      }
      this.entities.students.push(st);
    }
  }  
}

StudentResource.prototype.setService = function(service,opts){
  this.service = service;
  if (opts) this.serviceOptions = opts;
  return this;
}

Resource(StudentResource.prototype);
Emitter(StudentResource.prototype);


// dumb models

function Student(data){
  for (var k in data) this[k] = data[k];
  return this;
}

function School(data){
  for (var k in data) this[k] = data[k];
  return this;
}


describe('Resource', function(){
  beforeEach(function(done){
    request.del('/fixtures').end( function(){
      request.post('/fixtures/simple').end(done());
    });
  })

  beforeEach(function(done){
    var test = this;
    var api = new API(http);
    api.once('refresh', function(){
      var subject = new StudentResource(http)
                         .boot(api.resolvedLink('students'), function(){ done(); });
      subject.collection('students', Student);
      subject.serviceHandler = function(res){
        if (res.error) throw new Error('Error response '+res.status);
      }
      test.subject = subject;
    })
    api.boot('/api');
  })

  it('should boot from API', function(){
    // console.log(this.subject);
    assert(this.subject.entities['students'].length > 1);
  })

  it('should have nested entities', function(){
    var students = this.subject.entities['students'];
    for (var i=0;i<students.length;++i){
      if (students[i].school) { 
        assert('object' == typeof students[i].school);
      }
    }
  })

  it('should read options', function(done){
    this.subject.readOptions('self', function(res){
      assert(res.body.accept);
      done();
    })
  })

  it('should add new entity', function(){
    var student = new Student({name: 'Frank'})
    student.school = new School({id: 2})
    this.subject.add('all', student);
  })

  it('should update existing entity', function(){
    var student = this.subject.students().find('name == "Eric"');
    assert(student);
    student.email = "eric@school.edu";
    this.subject.update('student',{id: student.id},student);
  })

  it('should remove existing entity', function(){
    var student = this.subject.students().find('name == "Eric"');
    assert(student);
    this.subject.remove('student',{id: student.id});
  })

  it('should call service handler', function(done){
    this.subject.serviceHandler = function(){ done(); }
    this.subject.read('self');
  })

})


