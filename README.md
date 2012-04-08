#resourceful-redis [![Build Status](https://secure.travis-ci.org/particlebanana/resourceful-redis.png?branch=master)](http://travis-ci.org/particlebanana/resourceful-redis)

A Redis engine for [resourceful](https://github.com/flatiron/resourceful/), a model framework from the [flatiron](https://github.com/flatiron/) project.

#### Acknowledgement

resourceful-redis is based on all the other resourceful engines including the standard couchdb and memory engines. Also inspired by the following projects:

  - [resourceful-mongo](https://github.com/codebrew/resourceful-mongo) from codebrew
  - [resourceful-riak](https://github.com/admazely/resourceful-riak) from admazely

## Example

``` js
  var resourceful = require('../lib/resourceful-redis');

  var Creature = resourceful.define('creature', function () {

    // Specify redis engine and connection
    this.use("redis", {
      uri: "redis://DB:Pass@127.0.0.1:6379" // Set connection string here, auth is optional
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

## Installation

### Installing resourceful
``` bash
  $ [sudo] npm install resourceful
```

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