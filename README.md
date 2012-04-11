#resourceful-redis

A Redis engine for [resourceful](https://github.com/flatiron/resourceful/), a model framework from the [flatiron](https://github.com/flatiron/) project.

[![Build Status](https://secure.travis-ci.org/particlebanana/resourceful-redis.png?branch=master)](http://travis-ci.org/particlebanana/resourceful-redis)

#### Acknowledgement

resourceful-redis is based on all the other resourceful engines including the standard couchdb and memory engines. Also inspired by the following projects:

  - [resourceful-mongo](https://github.com/codebrew/resourceful-mongo) from codebrew
  - [resourceful-riak](https://github.com/admazely/resourceful-riak) from admazely

#### Status

resourceful-redis is just getting started. I wouldn't use it in production yet but try it out and if you find bugs create an issue so we can get it to a production ready state soon.

## Example

``` js
  var resourceful = require('../lib/resourceful-redis');

  var Creature = resourceful.define('creature', function () {

    // Specify redis engine and connection
    this.use("redis", {
      uri: "redis://DB:Pass@127.0.0.1:6379", // Set connection string here, auth is optional
      namespace: "<KEY TO USE AS NAMESPACE>" // Each model will have a different namespace to use as a key
    });

    // Specify some properties
    this.string('diet');
    this.bool('vertebrate');
    this.array('belly');

    this.timestamps();
  });

  Creature.prototype.feed = function (food) {
    this.belly.push(food);
  };
```

## Resourceful API
Resourceful-redis uses the [engines-test.js](https://github.com/flatiron/resourceful/blob/master/test/engines-test.js) test suite from the resourceful project in order to try and ensure API compatibility. It's edited to use [mocha][0] instead of Vows but should be similar. 

Currently resourceful-redis should support all of the CRUD methods that resourceful defines as well as simple find's and filters. In the future I would like to implement relationship modeling and hooks for redis pub/sub functionality.

## Installation

### Installing resourceful-redis
``` bash
  $ [sudo] npm install resourceful-redis
```

## Tests
All tests are written with [mocha][0] and should be run with [npm][1]:

``` bash
  $ npm test
```

#### Author: [Cody Stoltman](http://github.com/particlebanana)
#### License: [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)

[0]: http://visionmedia.github.com/mocha/
[1]: http://npmjs.org