
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express();

// middleware

app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.static(__dirname));
app.use(express.static(__dirname + '/..'));

// faux db

var db = { students: [], enrollments: [], classes: [], schools: [] };
db.studentWithSchool = function(student){
  var ret = {};
  for (var k in student) ret[k] = student[k];
  var school = db.find('schools',student.school);
  if (school){ ret.school = school };
  return ret;
}
db.find = function(ent,val){
  var ret = undefined
    , table = db[ent]
  table.forEach( function(rec){
    if (rec.id == val) { ret = rec; return; }
  });
  return ret;
}

// utility routes

app.del('/fixtures', function(req,res){
  db.schools = []; db.students = []; db.classes = []; db.enrollments = [];
  res.send(200);
})

app.post('/fixtures/:id', function(req, res){
  var id = req.params.id
    , fix = fixtures[id]
  fix.schools.forEach( function(s){
    db.schools.push(s);
  })
  fix.students.forEach( function(st){
    db.students.push(st);
  })
  fix.classes.forEach( function(c){
    db.classes.push(c);
  })
  fix.enrollments.forEach( function(e){
    db.enrollments.push(e);
  })
  res.send(200);
})

// API root

app.get('/api', function(req,res){
  res.send({
    links: {
      'students': '/students'
    }
  });
})

// students routes

app.options('/students', function(req,res){
  res.send({
    accept: ['GET','POST']
  })
})

app.get('/students', function(req, res){
  var page = req.params.page || 0
  var max = req.params.max || 20
  res.send({
    links: {
      self: '/students?page='+page+'&max='+max,
      where: '/students{?page,max}',
      students: '/students',
      student: '/students/{id}',
      studentSchool: '/students/{id}/school'
    },
    students: db.students.slice(page,max+page).map(db.studentWithSchool)
  });
})

// fixtures
var schools = [ { id: 1, name: 'Elementary A' },
                { id: 2, name: 'Elementary B' },
                { id: 3, name: 'Middle C' }
              ]

var fixtures = {};
fixtures.simple = {
  schools: schools,
  students: [ { id: 1, name: 'Albert', school: 2 },
              { id: 2, name: 'Betty', school: 1 },
              { id: 3, name: 'Clara', school: 2 },
              { id: 4, name: 'Dennis', school: 3 },
              { id: 5, name: 'Eric'}
            ],
  classes: [],
  enrollments: []
}

app.listen(3000);
console.log('test server listening on port 3000');
