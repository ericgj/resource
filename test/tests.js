
var assert = require('component-assert')
  , Spy = require('ericgj-minispy')
  , Resource = require('resource')

// Set up test model

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

Resource(PostResource.prototype);

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
        case 'author':
          for (var p in post.author){
            resource.entities.author[p] = post.author[p];
          }
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

/* ---------------------------- */

describe('Resource', function(){
  beforeEach(function(){
    this.subject = new PostResource( fixtures[0] );    
  });

  it('should expose specified entities', function(){
    var subject = this.subject;
    assert('A fine day on Hampstead Heath' == subject.post().title);
    assert('Karl Marx' ==  subject.author().name);
    assert(1 == subject.comments().length);
  })
  
  it('should update singular entity', function(){
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

})
