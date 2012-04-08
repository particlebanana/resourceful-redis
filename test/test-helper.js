var resourceful = require('../lib/resourceful-redis'),
    async = require('async'),
    redis = require('redis');

resourceful.env = 'test';

var DB = exports;

DB.people = [
  {name: 'Bob', age: 21},
  {name: 'Steve', age: 32},
  {name: 'Joe', age: 43}
];

DB.Person = resourceful.define('person', function() {

  this.use("redis", {
    uri: "redis://127.0.0.1:6379",
    namespace: "people"
  });

  this.string('name');
  this.number('age');
});

DB.createPeople = function(people, callback) {
  var peopleArray = [];

  async.forEach(people, function(person, done) {
    DB.createPerson(person, function(err, p) {
      peopleArray.push(p);
      done();
    });
  }, function(err) {
    callback(err, peopleArray);
  });
};

DB.createPerson = function(person, callback) {
  DB.Person.create(person, callback);
};

DB.drop = function(callback) {
  var conn = redis.createClient();
  conn.FLUSHDB(function() {
    conn.SET('resourceful:people:count', "0");
    callback();
  });
};