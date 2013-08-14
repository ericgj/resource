
var assert = require('component-assert')
  , Spy = require('ericgj-minispy')
  , Resource = require('resource')

// Set up test models

function Post(data)   { this.data = data; return this; }
function Comment(data){ this.data = data; return this; }

function PostResource(message, service){
  if (!(this instanceof PostResource)) return new PostResource(message,service);
  this.commands = [];
  this.entities = {};
  this.links = {};
  this.setService(service);
  this.expose('post');
  this.expose('author');
  this.expose('comments');
  parse(message, this);
  return this;
}

function CastedPostResource(message, service){
  if (!(this instanceof CastedPostResource)) return new CastedPostResource(message,service);
  this.commands = [];
  this.entities = {};
  this.links = {};
  this.setService(service);
  this.entity('post', Post);
  this.expose('author', function(obj){ return obj.id; });
  this.collection('comments', Comment);
  parse(message, this);
  return this;
}

Resource(PostResource.prototype);
Resource(CastedPostResource.prototype);

CastedPostResource.prototype.setService = 
PostResource.prototype.setService = function(service){
  this.service = service;
  return this;
}

function parse(message, resource){
  if (message.links) {
    for (var link in message.links) resource.links[link] = message.links[link];
  }
  
  resource.entities.post = {};
  resource.entities.comments = [];
  resource.entities.author = {};
  
  if (message.post) {
    var post = message.post;
    for (var prop in post) {
      switch(prop){
        case 'comments':
          for (var i=0;i<post.comments.length;++i){
            resource.entities.comments.push(post.comments[i]);
          }
          break;
        case 'author':
          for (var p in post.author){
            resource.entities.author[p] = post.author[p];
          }
          break;
        default:
          resource.entities.post[prop] = post[prop];
      }
    }
  }  
}

// fixtures

var fixtures = [];
fixtures.push( {
  links: {
    self: '/post/123',
    author: '/post/123/author',
    comments: '/post/123/comments'
  },
  post: {
    title: 'A fine day on Hampstead Heath',
    body: 'Once upon a time',
    date: '2013-08-01',
    author: {
      id: '/user/123',
      name: 'Karl Marx'
    },
    comments: [
      {
        id: '/comment/123',
        body: 'and a fine day it was',
        author: {
          id: '/user/456',
          name: 'Fred Engles'
        }
      }
    ]
  }
} );

fixtures.push( {
  links: {
    self: '/post/234',
    page: '/post{?page,max}',
    comment: '/post/234/comment/{id}'
  },
  post: {
    title: 'How the Grinch stole Christmas',
    comments: [
      { id: 456, body: 'I hated it' },
      { id: 789, body: 'I loved it' }
    ]
  }
} );

/* ---------------------------- */

describe('Resource', function(){
  beforeEach(function(){
    this.subject = new PostResource( fixtures[0] );    
  })

  it('should expose specified entities', function(){
    var subject = this.subject;
    assert('A fine day on Hampstead Heath' == subject.post().title);
    assert('Karl Marx' ==  subject.author().name);
    assert(1 == subject.comments().length);
  })
 
  it('should generate command to update singular entity', function(){
    var subject = this.subject
      , newAuthor = { id: '/user/456', name: 'Jules Verne' }
    assert(this.subject.links.author);
    var spy = new Spy()
    function dummy(address){ dummy.address = address; return dummy; }
    dummy.put = spy.watch.bind(spy);
    subject.setService(dummy);

    subject.update('author', newAuthor);
    subject.commit();
    
    assert(subject.links.author == dummy.address);
    assert(spy.calledOnce());
    assert(spy.calledWith(newAuthor));
  })

  it('should generate command to add to a collection', function(){
    var subject = this.subject
      , newComment = { id: '/comment/456', body: 'despite the rain' };
    assert(this.subject.links.comments);
    var spy = new Spy()
    function dummy(address){ dummy.address = address; return dummy; }
    dummy.post = spy.watch.bind(spy);
    subject.setService(dummy);

    subject.add('comments', newComment);
    subject.commit();

    assert(subject.links.comments == dummy.address);
    assert(spy.calledOnce());
    assert(spy.calledWith(newComment));
  })

  it('should generate two commands in order')

})

describe('Resource exposures with casting', function(){
  beforeEach(function(){
    this.subject = new CastedPostResource( fixtures[0] );    
  })

  it('should expose entity constructed with given function', function(){
    var subject = this.subject
    assert(Post === subject.post().constructor);
  })

  it('should expose result of casting function', function(){
    var subject = this.subject
    assert('/user/123' == subject.author());
  })

  it('should expose collection of entities constructed with given function', function(){
    var subject = this.subject
    subject.comments().each(function(obj){
      assert(Comment === obj.constructor);
    })
  })
})

describe('Resource command generation with URI template', function(){
  beforeEach(function(){
    this.subject = new PostResource( fixtures[1] );
  })

  it('list should resolve URI template with passed params', function(){
    var subject = this.subject;
    var spy = new Spy()
    function dummy(address){ dummy.address = address; return dummy; }
    dummy.get = spy.watch.bind(spy);
    subject.setService(dummy);

    subject.list('page', {page: 9, max: 999}, function(){});
    subject.commit();

    assert(spy.calledOnce());
    assert('/post?page=9&max=999' == dummy.address);
  })

  it('remove should resolve URI template with passed params', function(){
    var subject = this.subject;
    var spy = new Spy()
    function dummy(address){ dummy.address = address; return dummy; }
    dummy.del = spy.watch.bind(spy);
    subject.setService(dummy);

    subject.remove('comment', {id: 456});
    subject.commit();

    assert(spy.calledOnce());
    assert('/post/234/comment/456' == dummy.address);
  })

  it('update should resolve URI template with passed params', function(){
    var subject = this.subject
      , updComment = {id: 456, body: 'it could have been better'};
    var spy = new Spy()
    function dummy(address){ dummy.address = address; return dummy; }
    dummy.put = spy.watch.bind(spy);
    subject.setService(dummy);

    subject.update('comment', {id: 456}, updComment);
    subject.commit();

    assert(spy.calledOnce());
    assert('/post/234/comment/456' == dummy.address);
  })

})

