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

  describe("instance method", function(done) {

    it("partially updates model", function(done) {
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

  describe("constructor method", function(done) {

    it("partially updates model", function(done) {
      db.Person.create({ name: 'Bob', age: 99 }, function (err, person) {
        if (err) done(err);

        db.Person.update(person.id, {name:"Steve"}, function(err) {
          if(err) return done(err);

          db.Person.get(person.id, function(err, p) {
            p.name.should.equal("Steve");
            p.age.should.equal(99);
            done();
          });
        });
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

describe("find", function() {

  it("by attribute", function(done) {
    db.createPeople(db.people, function(err, array) {
      db.Person.find({age: 21}, function(err, people) {
        if(err) done(err);

        people.should.have.length(1);
        done();
      });
    });
  });

  it("by id", function(done) {
    db.createPeople(db.people, function(err, array) {
      db.Person.get(array[0].id, function(err, person) {
        if(err) done(err);

        person.name.should.equal('Bob');
        done();
      });
    });
  });

});

describe("all", function() {

  it("returns an array of objects", function(done) {
    db.createPeople(db.people, function(err, array) {
      db.Person.all(function(err, people) {
        if(err) done(err);

        people.should.have.length(3);
        done();
      });
    });
  });

});
