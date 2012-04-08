var db = require('./test-helper'),
    mongo = require("../lib/resourceful-redis"),
    should = require('should'),
    resourceful = require('resourceful');

beforeEach(db.drop);

describe("Creating", function() {

  it("creates a simple model", function(done) {
    
    db.Person.create({ name: 'Bob', age: 99 }, function (err, person) {
      if (err) { done(err); }

      should.exist(person.id);
      person.age.should.equal(99);
      done();
    });
  });
});

describe("Saving", function() {

  it("saves without error", function(done) {
    
    db.Person.create({ name: 'Bob', age: 99 }, function (err, person) {
      if (err) done(err);
      done();
    });
  });
});

describe("Updating", function() {

  it("paritally updates model", function(done) {
    db.Person.create({ name: 'Bob', age: 99 }, function (err, person) {
      if (err) done(err);

      person.update({name:"Steve"}, function(err) {

        if(err) return done(err);

        person.name.should.equal("Steve");
        person.age.should.equal(99);
        done();
      });
    });
  });
});

describe("Destroying", function() {

  it("by id", function(done) {

    db.Person.create(db.people.bob, function(err, bob) {
      db.Person.destroy(bob.id, function(err, result) {

        if(err) done(err);
  
        result.should.equal(1);
        done();
      });
    });
  });

});

