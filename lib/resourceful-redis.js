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
        callback(null);
      });
    }
  ], function(err) {
    self.get(key, cb);
  });

};


Redis.prototype.update = function(key, val, cb) {
  var self = this,
        id = self.config.key + key;

  self.get(key, function(err, old) {
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


//register engine with resourceful
resourceful.engines.Redis = Redis;

//export resourceful
module.exports = resourceful;