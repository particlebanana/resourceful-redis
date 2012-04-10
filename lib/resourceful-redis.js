var url = require('url'),
    redis = require('redis'),
    resourceful = require('resourceful'),
    async = require('async');

var Redis = exports.Redis = function Redis(config) {

  if (config.uri) {
    var redisUrl = url.parse('redis://' + config.uri, true);

    config.uri = redisUrl.hostname;
    config.port = parseInt(redisUrl.port, 10);

    if(redisUrl.auth) {
      var redisAuth = redisUrl.auth.split(':');
      config.database = redisAuth[0];
      config.pass = redisAuth[1];
    }
  }

  this.connection = redis.createClient(config.port, config.uri);
  if (config.pass) this.connection.auth(config.pass);

  if(config.namespace) {
    this.namespace = config.namespace;
  } else {
    throw new Error('namespace must be set in the config for each model.');
  }

  this.cache = new resourceful.Cache();
  this.config = config;

  this.config.count_key = 'resourceful:' + this.namespace + ':count';
  this.config.key = 'resourceful:' + this.namespace + ':id:';
  this.config.index_key = 'resourceful:' + this.namespace + ':indexes';
};


Redis.prototype.protocol = 'redis';


Redis.prototype.get = function(key, cb) {
  var self = this,
        id = self.config.key + key;

  self.connection.HGETALL(id, function(err, val) {
    if(err) {
      err.status = 404;
      return cb(err);
    }

    if(!val || Object.keys(val).length === 0) {
      err = {status: 404};
      return cb(err);
    }

    cb(null, val);
  });

};


Redis.prototype.save = function(key, val, cb) {
  var self = this;

  var args = Array.prototype.slice.call(arguments);
  cb = args.pop();
  val = args.pop();

  var index;

  async.waterfall([
    function increment_index(callback) {
      self.connection.INCR(self.config.count_key, function(err, id) {
        return callback(err, id);
      });
    },
    function set_index(_idx, callback) {
      index = _idx;

      if(!key) {
        key = _idx;
        val._id = _idx;
      }

      return callback(null);
    },
    function write_hash(callback) {
      var id = self.config.key + key;

      self.connection.HMSET(id, val, function(err) {
        if(err) return callback(err);
        self.cache.put(key, val);
        return callback(null);
      });
    },
    function write_index(callback) {
      var id = self.config.key + key;
      self.connection.ZADD(self.config.index_key, index, id, callback);
    }
  ], function(err) {
    if(err) cb(err);
    self.get(key, cb);
  });

};


Redis.prototype.update = function(key, val, cb) {
  var self = this,
        id = this.config.key + key;

  this.get(key, function(err, old) {
    self.connection.HMSET(id, resourceful.mixin(old, val), function(err) {
      if(err) return cb(err);
      self.get(key, cb);
    });
  });
};


Redis.prototype.destroy = function(key, cb) {
  var id = this.config.key + key;
  this.connection.DEL(id, cb);
};


Redis.prototype.find = function(conditions, cb) {
  var self = this;

  this.filter(function(obj) {
    return Object.keys(conditions).every(function (k) {
      // There must be a better way to do this rather than
      // converting both values to a string
      return conditions[k].toString() ===  obj[k].toString();
    });
  }, cb);
};


Redis.prototype.filter = function(filter, cb) {
  var self = this,
      keys = [],
      data = [],
      result = [];

  async.waterfall([
    function get_indexes(callback) {
      self.connection.ZRANGE(self.config.index_key, 0, -1, function(err, idxs) {
        if(err) callback(err);
        keys = idxs;
        callback(err, keys);
      });
    },
    function get_data(keys, callback) {
      async.forEach(keys, function(key, done) {
        self.connection.HGETALL(key, function(err, val) {
          if(err) return done(err);
          data.push(val);
          done();
        });
      }, function(err) {
        callback(err);
      });
    },
    function build_results(callback) {
      Object.keys(data).forEach(function (k) {
        if (filter(data[k])) {
          result.push(data[k]);
        }
      });

      callback();
    }
  ], function() {
    cb(null, result);
  });
};


Redis.prototype.sync = function(factory, callback) {
  process.nextTick(function () { callback(); });
};


//register engine with resourceful
resourceful.engines.Redis = Redis;

//export resourceful
module.exports = resourceful;