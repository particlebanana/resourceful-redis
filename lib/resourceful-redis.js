var url = require('url'),
    redis = require('redis'),
    resourceful = require('resourceful'),
    async = require('async');

var Redis = exports.Redis = function Redis(options) {

  options = options || {};
  this.uri = options.uri;
  this.namespace = options.namespace;

  // Create a new connection to Redis
  if (this.uri && !options.connection) {
    var redisUrl = url.parse('redis://' + this.uri, true);

    this.uri = redisUrl.hostname;
    this.port = parseInt(redisUrl.port, 10);

    if(redisUrl.auth) {
      var redisAuth = redisUrl.auth.split(':');
      this.database = redisAuth[0];
      this.pass = redisAuth[1];
    }

    this.connection = redis.createClient(options.port, this.uri);
    if (this.pass) this.connection.auth(this.pass);
  }

  // Use the connection passed in
  if(!this.connection && options.connection) {
    this.connection = options.connection;
  }

  if(!this.namespace) {
    throw new Error('namespace must be set in the config for each model.');
  }

  this.cache = new resourceful.Cache();

  /**
   * Count key is an incrementing value that is used to assign
   * an _id value when no key is supplied and to set the score
   * value for the indexes in a redis sorted set.
   *
   * TODO:
   * Currently the count_key gets incremented on each save.
   * Need to work on this so the scores don't get out of whack.
   */
  this.config = {};
  this.config.count_key = 'resourceful:' + this.namespace + ':count';
  this.config.index_key = 'resourceful:' + this.namespace + ':indexes';
  this.config.key = 'resourceful:' + this.namespace + ':id:';
};


Redis.prototype.protocol = 'redis';


Redis.prototype.load = function (data) {
  throw new(Error)("Load not valid for redis engine.");
};


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

    return cb(null, val);
  });

};


Redis.prototype.save = function(key, val, cb) {
  var self = this,
      index;

  var args = Array.prototype.slice.call(arguments);
  cb = args.pop();
  val = args.pop();

  async.waterfall([
    function increment_index(callback) {
      self.connection.INCR(self.config.count_key, function(err, id) {
        return callback(err, id);
      });
    },
    function set_index(_idx, callback) {
      index = _idx;

      if(!args.length || !key) {
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
    if(err) return cb(err);
    self.connection.HMSET(id, resourceful.mixin(old, val), function(err) {
      if(err) return cb(err);
      self.cache.update(key, val);
      self.get(key, cb);
    });
  });
};


Redis.prototype.destroy = function(key, cb) {
  var self = this,
      id = this.config.key + key;

  async.waterfall([
    function remove_key(callback) {
      self.connection.DEL(id, function(err) {
        callback(err);
      });
    },
    function remove_index(callback) {
      self.connection.ZREM(self.config.index_key, id, function(err) {
        callback(err);
      });
    }
  ], function(err) {
    if(err) cb(err);
    cb(null);
  });
};


Redis.prototype.find = function(conditions, cb) {
  var self = this;

  this.filter(function(obj) {
    return Object.keys(conditions).every(function (k) {
      return conditions[k] ==  obj[k];
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
    },
    function parse_results(callback) {
      result.forEach(function(data) {
        if(data.ctime) { data.ctime = parseInt(data.ctime, 10); }
        if(data.mtime) { data.mtime = parseInt(data.mtime, 10); }
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