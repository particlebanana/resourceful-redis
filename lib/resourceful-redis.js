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

  this.cache = new resourceful.Cache();
  this.config = config;

  this.config.count_key = 'resourceful:count';
  this.config.key = 'resourceful:id:';
  this.config.index_key = 'resourceful:indexes';
};


Redis.prototype.protocol = 'redis';


Redis.prototype.get = function(key, cb) {
  var self = this,
        id = self.config.key + key;

  self.connection.HGETALL(id, function(err, val) {
    if(err) return cb(err);

    cb(null, val);
  });

};


Redis.prototype.save = function(key, val, cb) {
  var self = this;

  var args = Array.prototype.slice.call(arguments);
  cb = args.pop();
  val = args.pop();

  async.waterfall([
    function increment_index(callback) {
      if (!args.length || !key) {
        self.connection.INCR(self.config.count_key, function(err, id) {
          return callback(err, id);
        });
      }
      else { return callback(null, key); }
    },
    function set_key(_idx, callback) {
      key = _idx;
      val._id = key;
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

      self.connection.ZADD(self.config.index_key, key, id, callback);
    }
  ], function() {
    self.get(key, cb);
  });

};


Redis.prototype.put = function () {
  this.update.apply(this, arguments);
};


Redis.prototype.update = function(key, val, cb) {
  var self = this,
        id = this.config.key + key;

  this.get(key, function(err, old) {
    var obj = resourceful.mixin(old, val);

    self.connection.HMSET(id, obj, function(err) {
      if(err) return cb(err);
      cb(err, obj);
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
    var item = self.cache.get(obj._id);
    return Object.keys(conditions).every(function (k) {
      return conditions[k] ===  item[k];
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