/**
 * Flatiron Resourceful Engines Test
 *
 * Converted from Vows to Mocha
 * Used to test API compatibility
 *
 * https://github.com/flatiron/resourceful/blob/master/test/engines-test.js
 */

var resourceful = require("../lib/resourceful-redis"),
    should = require('should'),
    redis = require('redis'),
    async = require('async');

describe('engines-test', function() {

  var connection = redis.createClient();

  /**
   * Define some resources to test
   *
   * Book
   * Author
   */

  var Book = resourceful.define('book', function() {

    this.use("redis", {
      connection: connection,
      namespace: "book"
    });

    this.string('title');
    this.number('year');
    this.bool('fiction');
  });

  var Author = resourceful.define('author', function() {

    this.use("redis", {
      connection: connection,
      namespace: "author"
    });

    this.number('age');
    this.string('hair').sanitize('lower');
  });


  /**
   * Load Test Data Into Resources
   *
   * This is used in the resourceful-engines test
   * to manipulate and test the results.
   */

  var books = [
    {_id: 'bob/1', title: 'Nodejs sucks!', year: 2003, fiction: true},
    {_id: 'tim/1', title: 'Nodejitsu rocks!', year: 2008, fiction: false},
    {_id: 'bob/2', title: 'Loling at you', year: 2011, fiction: true}
  ];

  var authors = [
    {_id: 'bob', age: 35, hair: 'black'},
    {_id: 'tim', age: 16, hair: 'brown'},
    {_id: 'mat', age: 29, hair: 'black'}
  ];

  function createRecords(objects, resource, callback) {
    var objArray = [];

    async.forEach(objects, function(obj, done) {
      createRecord(obj, resource, function(err, i) {
        objArray.push(i);
        done();
      });
    }, function(err) {
      callback(err, objArray);
    });
  }

  function createRecord(obj, resource, callback) {
    resource.create(obj, callback);
  }

  /**
   * Before and after test hooks
   */

  before(function(done) {
    async.parallel({
      books: function(callback) {
        createRecords(books, Book, callback);
      },
      authors: function(callback) {
        createRecords(authors, Author, callback);
      }
    },
    function(err, resources) {
      done(err);
    });
  });

  after(function(done) {
    connection.FLUSHDB(function() {
      done();
    });
  });


  /**
   * Recreate the Resourceful Engines-Test
   * in mocha to ensure compatibility
   * with the resourceful engine API
   */

  describe('define resource', function() {
    describe('book', function() {
      it('should have 4 properties', function() {
        Object.keys(Book.properties).should.have.length(4);
      });
    });

    describe('author', function() {
      it('should have 3 properties', function() {
        Object.keys(Author.properties).should.have.length(3);
      });
    });
  });

  describe('Resource.all() request', function() {
    it('should respond with an array of all records', function(done) {
      Author.all(function(err, obj) {
        should.not.exist(err);
        obj.constructor.should.equal(Array);
        obj.should.have.length(3);
        done();
      });
    });
  });

  describe('Resource.get() request', function() {
    describe('when successful', function() {
      it('should respond with a Resource instance', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj.should.be.a('object');
          obj.should.be.an.instanceof(resourceful.Resource);
          obj.constructor.should.equal(Author);
          done();
        });
      });

      it('should respond with the right object', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj._id.should.equal('bob');
          obj.age.should.equal(35);
          obj.hair.should.equal('black');
          obj.resource.should.equal('Author');
          done();
        });
      });

      it('should not be a new record', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj.isNewRecord.should.be.false;
          done();
        });
      });
    });
    describe('when unsuccessful', function() {
      it('should respond with an error', function(done) {
        Author.get('david', function(err, obj) {
          err.status.should.equal(404);
          should.not.exist(obj);
          done();
        });
      });
    });
  });

  describe('Resource.create() request', function() {
    var err, obj;

    before(function(done) {
      Author.create({ _id: 'han', age: 30, hair: 'red'}, function(e, i) {
        err = e;
        obj = i;
        done();
      });
    });

    it('should return the newly created object', function() {
      should.not.exist(err);
      obj.constructor.should.equal(Author);
      obj.should.be.an.instanceof(Author);
      obj._id.should.equal('han');
      obj.age.should.equal(30);
      obj.hair.should.equal('red');
      obj.resource.should.equal('Author');
    });

    it('should not be a new record', function() {
      should.not.exist(err);
      obj.isNewRecord.should.be.false;
    });

    describe('should create the record in the db', function() {
      it('should respond with a Resource instance', function(done) {
        Author.get('han', function(err, obj) {
          should.not.exist(err);
          obj.should.be.a('object');
          obj.should.be.an.instanceof(resourceful.Resource);
          obj.constructor.should.equal(Author);
          done();
        });
      });

      it('should respond with the right object', function(done) {
        Author.get('han', function(err, obj) {
          should.not.exist(err);
          obj._id.should.equal('han');
          obj.age.should.equal(30);
          obj.hair.should.equal('red');
          obj.resource.should.equal('Author');
          done();
        });
      });

      it('should not be a new record', function() {
        should.not.exist(err);
        obj.isNewRecord.should.be.false;
      });
    });
  });

  describe('Instantiating a new instance', function() {
    it('should be a new record', function() {
      var author = Author.new({_id: 'kim', age: 32, hair: 'gold'});
      author.isNewRecord.should.be.true;
    });

    describe('should not be in the db', function() {
      it('should respond with an error', function(done) {
        Author.get('kim', function(err, obj) {
          err.status.should.equal(404);
          should.not.exist(obj);
          done();
        });
      });
    });
  });

  describe('Resource.destroy() request', function() {
    it('should be successful', function(done) {
      Author.destroy('han', function(err, obj) {
        should.not.exist(err);
        done();
      });
    });

    describe('should delete the object in db', function() {
      it('should be missing', function(done) {
        Author.get('han', function(err, obj) {
          err.status.should.equal(404);
          done();
        });
      });
    });
  });

  describe('Resource.find() request', function() {
    describe('when successful', function() {
      it('should respond with an array of length 2', function(done) {
        Author.find({hair: "black"}, function(err, obj) {
          should.not.exist(err);
          obj.length.should.equal(2);
          done();
        });
      });

      it('should respond with an array of Resource instances', function(done) {
        Author.find({hair: "black"}, function(err, obj) {
          should.not.exist(err);
          obj.constructor.should.equal(Array);
          obj[0].should.be.an.instanceof(resourceful.Resource);
          obj[1].should.be.an.instanceof(resourceful.Resource);
          obj[0]._id.should.equal('bob');
          obj[0].age.should.equal(35);
          obj[0].hair.should.equal('black');
          obj[0].resource.should.equal('Author');
          done();
        });
      });
    });

    it('should not be a new record', function(done) {
      Author.find({hair: "black"}, function(err, obj) {
        should.not.exist(err);
        obj[0].isNewRecord.should.be.false;
        obj[1].isNewRecord.should.be.false;
        done();
      });
    });

    describe('when unsuccessful', function() {
      it('should respond with an empty array', function(done) {
        Author.find({hair: "blue"}, function(err, obj) {
          should.not.exist(err);
          obj.constructor.should.equal(Array);
          obj.length.should.equal(0);
          done();
        });
      });
    });
  });

  describe('Resource.update() request', function() {
    describe('check for instance', function() {
      it('should have a `bob` object', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj._id.should.equal('bob');
          obj.age.should.equal(35);
          obj.hair.should.equal('black');
          obj.resource.should.equal('Author');
          done();
        });
      });

      it('should not be a new record', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj.isNewRecord.should.be.false;
          done();
        });
      });
    });

    describe('successful update request', function() {
      var err, obj;

      before(function(done) {
        Author.update('bob', { age: 31 }, function(e, i) {
          err = e;
          obj = i;
          done();
        });
      });

      it('should respond with a Resource instance', function() {
        should.not.exist(err);
        obj.should.be.a('object');
        obj.should.be.an.instanceof(resourceful.Resource);
        obj.constructor.should.equal(Author);
      });

      it('should respond with the right object', function() {
        should.not.exist(err);
        obj._id.should.equal('bob');
        obj.age.should.equal(31);
        obj.hair.should.equal('black');
        obj.resource.should.equal('Author');
      });

      it('should not be a new record', function() {
        should.not.exist(err);
        obj.isNewRecord.should.be.false;
      });

      describe('should update the object in db', function() {
        it('should respond with a Resource instance', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj.should.be.a('object');
            obj.should.be.an.instanceof(resourceful.Resource);
            obj.constructor.should.equal(Author);
            done();
          });
        });

        it('should respond with the right object', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj._id.should.equal('bob');
            obj.age.should.equal(31);
            obj.hair.should.equal('black');
            obj.resource.should.equal('Author');
            done();
          });
        });

        it('should not be a new record', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj.isNewRecord.should.be.false;
            done();
          });
        });
      });
    });
  });

  describe('Resource.save() request', function() {
    describe('check for instance', function() {
      it('should have a `bob` object', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj._id.should.equal('bob');
          obj.age.should.equal(31);
          obj.hair.should.equal('black');
          obj.resource.should.equal('Author');
          done();
        });
      });

      it('should not be a new record', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj.isNewRecord.should.be.false;
          done();
        });
      });
    });

    describe('successful save request', function() {
      var err, obj;

      before(function(done) {
        Author.get('bob', function(e, i) {
          i.age = 35;
          Author.save(i, function(e, res) {
            err = e;
            obj = res;
            done();
          });
        });
      });

      it('should respond with a Resource instance', function() {
        should.not.exist(err);
        obj.should.be.a('object');
        obj.should.be.an.instanceof(resourceful.Resource);
        obj.constructor.should.equal(Author);
      });

      it('should respond with the right object', function() {
        should.not.exist(err);
        obj._id.should.equal('bob');
        obj.age.should.equal(35);
        obj.hair.should.equal('black');
        obj.resource.should.equal('Author');
      });

      it('should not be a new record', function() {
        should.not.exist(err);
        obj.isNewRecord.should.be.false;
      });

      describe('should update the object in db', function() {
        it('should respond with a Resource instance', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj.should.be.a('object');
            obj.should.be.an.instanceof(resourceful.Resource);
            obj.constructor.should.equal(Author);
            done();
          });
        });

        it('should respond with the right object', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj._id.should.equal('bob');
            obj.age.should.equal(35);
            obj.hair.should.equal('black');
            obj.resource.should.equal('Author');
            done();
          });
        });

        it('should not be a new record', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj.isNewRecord.should.be.false;
            done();
          });
        });
      });
    });
  });

  describe('Resource.save() request', function() {
    describe('check for instance', function() {
      it('should have a `bob` object', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj._id.should.equal('bob');
          obj.age.should.equal(35);
          obj.hair.should.equal('black');
          obj.resource.should.equal('Author');
          done();
        });
      });

      it('should not be a new record', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj.isNewRecord.should.be.false;
          done();
        });
      });
    });

    describe('successful save request', function() {
      var err, obj;

      before(function(done) {
        Author.get('bob', function(e, i) {
          i.age = 31;
          i.hair = 'red';
          Author.save(i, function(e, res) {
            err = e;
            obj = res;
            done();
          });
        });
      });

      it('should respond with a Resource instance', function() {
        should.not.exist(err);
        obj.should.be.a('object');
        obj.should.be.an.instanceof(resourceful.Resource);
        obj.constructor.should.equal(Author);
      });

      it('should respond with the right object', function() {
        should.not.exist(err);
        obj._id.should.equal('bob');
        obj.age.should.equal(31);
        obj.hair.should.equal('red');
        obj.resource.should.equal('Author');
      });

      it('should not be a new record', function() {
        should.not.exist(err);
        obj.isNewRecord.should.be.false;
      });

      describe('should update the object in db', function() {
        it('should respond with a Resource instance', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj.should.be.a('object');
            obj.should.be.an.instanceof(resourceful.Resource);
            obj.constructor.should.equal(Author);
            done();
          });
        });

        it('should respond with the right object', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj._id.should.equal('bob');
            obj.age.should.equal(31);
            obj.hair.should.equal('red');
            obj.resource.should.equal('Author');
            done();
          });
        });

        it('should not be a new record', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj.isNewRecord.should.be.false;
            done();
          });
        });
      });
    });
  });

  describe('Resource.update() request', function() {
    describe('check for instance', function() {
      it('should have a `bob` object', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj._id.should.equal('bob');
          obj.age.should.equal(31);
          obj.hair.should.equal('red');
          obj.resource.should.equal('Author');
          done();
        });
      });

      it('should not be a new record', function(done) {
        Author.get('bob', function(err, obj) {
          should.not.exist(err);
          obj.isNewRecord.should.be.false;
          done();
        });
      });
    });

    describe('successful update request', function() {
      var err, obj;

      before(function(done) {
        Author.get('bob', function(e, i) {
          i.age = 35;
          i.hair = 'black';
          Author.save(i, function(e, res) {
            err = e;
            obj = res;
            done();
          });
        });
      });

      it('should respond with a Resource instance', function() {
        should.not.exist(err);
        obj.should.be.a('object');
        obj.should.be.an.instanceof(resourceful.Resource);
        obj.constructor.should.equal(Author);
      });

      it('should respond with the right object', function() {
        should.not.exist(err);
        obj._id.should.equal('bob');
        obj.age.should.equal(35);
        obj.hair.should.equal('black');
        obj.resource.should.equal('Author');
      });

      it('should not be a new record', function() {
        should.not.exist(err);
        obj.isNewRecord.should.be.false;
      });

      describe('should update the object in db', function() {
        it('should respond with a Resource instance', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj.should.be.a('object');
            obj.should.be.an.instanceof(resourceful.Resource);
            obj.constructor.should.equal(Author);
            done();
          });
        });

        it('should respond with the right object', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj._id.should.equal('bob');
            obj.age.should.equal(35);
            obj.hair.should.equal('black');
            obj.resource.should.equal('Author');
            done();
          });
        });

        it('should not be a new record', function(done) {
          Author.get('bob', function(err, obj) {
            should.not.exist(err);
            obj.isNewRecord.should.be.false;
            done();
          });
        });
      });
    });
  });

  describe('instance destroy()', function() {
    var obj;

    before(function(done) {
      Author.create({ _id: 'han', age: 30, hair: 'red'}, function(err, instance) {
        obj = instance;
        done();
      });
    });

    describe('Resource.prototype.destroy() request', function() {
      var err;

      before(function(done) {
        obj.destroy(function(e, i) {
          err = e;
          done();
        });
      });

      it('should be successful', function() {
        should.not.exist(err);
      });

      describe('should delete the object in db', function() {
        it('should be missing', function(done) {
          Author.get('han', function(err, obj) {
            err.status.should.equal(404);
            done();
          });
        });
      });
    });
  });

  describe('instance reload()', function() {
    var err, obj;

    before(function(done) {
      Author.get('bob', function(e, instance) {
        err = e; 
        obj = instance;
        done();
      });
    });

    describe('Resource.prototype.reload() request', function() {
      it('should respond with a Resource instance', function(done) {
        obj.reload(function(err, instance) {
          should.not.exist(err);
          obj.should.be.a('object');
          obj.should.be.an.instanceof(resourceful.Resource);
          obj.constructor.should.equal(Author);
          done();
        });
      });

      it('should respond with the right object', function(done) {
        obj.reload(function(err, obj) {
          should.not.exist(err);
          obj._id.should.equal('bob');
          obj.age.should.equal(35);
          obj.hair.should.equal('black');
          obj.resource.should.equal('Author');
          done();
        });
      });

      it('should not be a new record', function(done) {
        obj.reload(function(err, obj) {
          should.not.exist(err);
          obj.isNewRecord.should.be.false;
          done();
        });
      });
    });
  });

  describe('Creating object without `id`', function() {
    var err, obj;

    before(function(done) {
      Author.create({age: 51, hair: 'white'}, function(e, instance) {
        err = e;
        obj = instance;
        done();
      });
    });

    it('should be successful', function() {
      should.not.exist(err);
      should.exist(obj._id);
      obj._id.should.not.equal('undefined');
      obj.age.should.equal(51);
      obj.hair.should.equal('white');
      obj.resource.should.equal('Author');
    });
  });

});