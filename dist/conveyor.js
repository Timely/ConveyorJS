(function() {
  var ConveyorBase, ConveyorUtil,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ConveyorUtil = (function() {
    function ConveyorUtil() {}

    ConveyorUtil.prototype._arrayForEach = function(a, cb) {
      if (!Array.isArray(a)) {
        throw "_arrayForEach expects an array, given: " + (typeof a);
      }
      return a.length;
    };

    ConveyorUtil.makePromise = function(obj) {
      obj.prototype.__pr_util = function() {
        if (this._resolvers == null) {
          this._resolvers = [];
        }
        if (this._rejecters == null) {
          return this._rejecters = [];
        }
      };
      obj.prototype.resolve = function() {
        var fn, i, len, ref, results;
        this.__pr_util();
        ref = this._resolvers;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          fn = ref[i];
          results.push(fn.apply(this, arguments));
        }
        return results;
      };
      obj.prototype.reject = function() {
        var fn, i, len, ref, results;
        this.__pr_util();
        ref = this._rejecters;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          fn = ref[i];
          results.push(fn.apply(this, arguments));
        }
        return results;
      };
      obj.prototype.then = function(success, fail) {
        this.__pr_util();
        if (success) {
          this._resolvers.push(success);
        }
        if (fail) {
          this._rejecters.push(fail);
        }
        return this;
      };
      return obj.prototype["catch"] = function(fail) {
        this.__pr_util();
        if (fail) {
          this._rejecters.push(fail);
        }
        return this;
      };
    };

    return ConveyorUtil;

  })();

  ConveyorBase = (function(superClass) {
    extend(ConveyorBase, superClass);

    function ConveyorBase() {
      return ConveyorBase.__super__.constructor.apply(this, arguments);
    }

    ConveyorBase.prototype._setDefaults = function(base, opts) {
      var results, x;
      if (typeof opts === 'object') {
        for (x in opts) {
          base[x] = opts[x];
        }
      }
      results = [];
      for (x in base) {
        results.push(this[x] = base[x]);
      }
      return results;
    };

    return ConveyorBase;

  })(ConveyorUtil);

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorBase = ConveyorBase;

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorUtil = ConveyorUtil;

}).call(this);

(function() {
  var ConveyorInterface, root,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ConveyorInterface = (function(superClass) {
    extend(ConveyorInterface, superClass);

    function ConveyorInterface(options) {
      this.options = options;
    }

    ConveyorInterface.prototype.save = function(model) {
      var belt, data;
      data = model.state.snapshot();
      belt = new ConveyorBelt('publish', this.transformers, data);
      return belt.promise;
    };

    ConveyorInterface.prototype.$remove = function() {};

    ConveyorInterface.prototype.$list = function() {};

    ConveyorInterface.prototype.$create = function() {};

    return ConveyorInterface;

  })(ConveyorBase);

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.ConveyorInterface = ConveyorInterface;

}).call(this);

(function() {
  var ConveyorTransformer, root,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ConveyorTransformer = (function(superClass) {
    extend(ConveyorTransformer, superClass);

    function ConveyorTransformer(opts) {
      this._setDefaults({
        _applier: null,
        models: {},
        _publisher: null
      });
      if (opts) {
        if (opts.onApply) {
          this._applier = opts.onApply;
        }
        if (opts.onPublish) {
          this._publisher = opts.onPublish;
        }
      }
    }

    ConveyorTransformer.prototype.onApply = function(fn) {
      this._applier = fn;
      return this;
    };

    ConveyorTransformer.prototype.onPublish = function(fn) {
      this._publisher = fn;
      return this;
    };

    ConveyorTransformer.prototype.$apply = function(data, belt) {
      if (this._applier) {
        return this._applier.call(belt, data);
      }
    };

    ConveyorTransformer.prototype.$publish = function(data, belt) {
      if (this._publisher) {
        return this._publisher.call(belt, data);
      }
    };

    return ConveyorTransformer;

  })(ConveyorBase);

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.ConveyorTransformer = ConveyorTransformer;

}).call(this);

(function() {
  var ConveyorBelt;

  ConveyorBelt = (function() {
    function ConveyorBelt(data, transformers, direction) {
      this.promise = new ConveyorPromise;
      this.data = data;
      this.transformers = transformers;
      this.direction = direction || 'apply';
      this.pos = -1;
      this.status = -1;
      this.error = false;
      this.warnings = [];
      this.next(this.data);
    }

    ConveyorBelt.prototype.next = function(data) {
      this.data = data;
      this.pos++;
      this.status = 0;
      if (this.pos < this.transformers.length) {
        this.transformers[this.pos]["$" + this.direction](this.data, this);
      } else {
        this.status = 1;
        this.promise.resolve(data);
      }
      return this;
    };

    ConveyorBelt.prototype.reject = function(err) {
      return this.promise.reject(err);
    };

    ConveyorBelt.prototype.skip = function() {
      return this.next(this.data);
    };

    ConveyorBelt.prototype.warn = function(warning) {
      return this.warnings.push(warning);
    };

    ConveyorBelt.prototype.later = function(executor) {};

    ConveyorBelt.prototype.inject = function(transformer) {
      this.transformers.splice(this.pos + 1, 0, transformer);
      return this;
    };

    ConveyorBelt.prototype.append = function(transformer) {
      this.transformers.push(transformer);
      return this;
    };

    ConveyorBelt.run = function(d, t, dd) {
      return (new ConveyorBelt(d, t, dd)).promise;
    };

    ConveyorBelt.thread = function(arr, t, dd) {
      var d, i, len, promises;
      promises = [];
      for (i = 0, len = arr.length; i < len; i++) {
        d = arr[i];
        promises.push((new ConveyorBelt(d, t, dd)).promise);
      }
      return ConveyorPromise.aggregate(promises);
    };

    return ConveyorBelt;

  })();

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorBelt = ConveyorBelt;

}).call(this);

(function() {
  var ConveyorConflict;

  ConveyorConflict = (function() {
    function ConveyorConflict() {}

    return ConveyorConflict;

  })();

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorConflict = ConveyorConflict;

}).call(this);

(function() {
  var Conveyor,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Conveyor = (function(superClass) {
    extend(Conveyor, superClass);

    function Conveyor() {
      this._setDefaults({
        transformers: {},
        models: {},
        interfaces: {}
      });
    }

    Conveyor.prototype.registerTransformer = function(name) {
      return this.transformers[name] = new ConveyorTransformer;
    };

    Conveyor.prototype.registerModel = function() {};

    Conveyor.prototype.registerInterface = function() {};

    return Conveyor;

  })(ConveyorBase);

  (typeof exports !== "undefined" && exports !== null ? exports : this).Conveyor = Conveyor;

}).call(this);

(function() {
  var ConveyorFacade;

  ConveyorFacade = (function() {
    function ConveyorFacade() {}

    return ConveyorFacade;

  })();

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorFacade = ConveyorFacade;

}).call(this);

(function() {
  var ConveyorHttpInterface,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ConveyorHttpInterface = (function(superClass) {
    extend(ConveyorHttpInterface, superClass);

    function ConveyorHttpInterface(options) {
      this._setDefaults({
        endpoint: null,
        actions: [],
        transformers: [],
        listTransformers: []
      }, options);
    }

    ConveyorHttpInterface.prototype.fetch = function() {};

    ConveyorHttpInterface.prototype.remove = function() {};

    ConveyorHttpInterface.prototype.list = function(args) {
      var path, promise;
      promise = new ConveyorPromise;
      path = this.endpoint;
      this._req('get', path, args).then((function(_this) {
        return function(data) {
          return ConveyorBelt.run(data, _this.listTransformers, 'apply').then(function(value) {
            if (!(value instanceof Array)) {
              throw "list must be array";
            } else {
              return ConveyorBelt.thread(data, _this.transformers, 'apply').then(promise);
            }
          }, promise.reject);
        };
      })(this), function(xhr, status, err) {
        return promise.reject(err);
      });
      return promise;
    };

    ConveyorHttpInterface.prototype.save = function(data) {};

    ConveyorHttpInterface.prototype._buildPath = function() {};

    ConveyorHttpInterface.prototype._req = function(method, path, args) {
      return $.ajax({
        url: path,
        method: method,
        data: args
      });
    };

    return ConveyorHttpInterface;

  })(ConveyorInterface);

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorHttpInterface = ConveyorHttpInterface;

}).call(this);


/*
 * CoffeeDoc example documentation #

This is a module-level docstring, and will be displayed at the top of the module documentation.
Documentation generated by [CoffeeDoc](http://github.com/omarkhan/coffeedoc)
 */

(function() {
  var ConveyorModel, root;

  ConveyorModel = (function() {

    /*
    This docstring documents MyClass. It can include *Markdown* syntax,
    which will be converted to html.
     */
    ConveyorModel._refCount = 0;

    function ConveyorModel(data) {
      this._ref = this.constructor._refCount++;
      this.data = {};
      this.interfaces = {};
      this.sync(data);
    }

    ConveyorModel.prototype.save = function() {

      /* Save documentation goes here. */
    };

    ConveyorModel.prototype.remove = function() {};

    ConveyorModel.list = function(params) {
      return this.firstInterface('list').list(params).then((function(_this) {
        return function(arr) {
          var hm, i, item, len, out;
          out = [];
          for (i = 0, len = arr.length; i < len; i++) {
            item = arr[i];
            out.push(_this.sync(item));
          }
          return hm = _this._collectionize(out);
        };
      })(this));
    };

    ConveyorModel.sync = function(data) {
      var pk;
      pk = data[this.primaryKey];
      if (!pk) {
        throw "You can only sync models with a primary key.";
      }
      if (this.index[this.name + "_" + pk] == null) {
        return this.index[this.name + "_" + pk] = new this.$self(data);
      } else {
        return this.index[this.name + "_" + pk].sync(data);
      }
    };

    ConveyorModel.prototype.sync = function(data) {
      var conf, key, val;
      for (key in data) {
        val = data[key];
        conf = this.fields[key];
        if (conf != null) {
          if (ConveyorValue[conf.type] != null) {
            this.data[key] = new ConveyorValue[conf.type](val, this, conf);
          }
        }
        if (this.data[key] == null) {
          console.warn('ConveyorModel::constructor ignoring key: ', key, data[key]);
        }
      }
      return this;
    };

    ConveyorModel.prototype.get = function(key) {
      if (this.data[key]) {
        return this.data[key].get();
      } else {
        return null;
      }
    };

    ConveyorModel.prototype.set = function(key, value) {
      if (this.data[key]) {
        return this.data[key].set(value);
      } else {
        return null;
      }
    };

    ConveyorModel._collectionize = function(arr) {
      arr.$changed = function() {
        return this.filter(function(model) {
          return model.dirty;
        });
      };
      return arr;
    };

    ConveyorModel.create = function(params) {};

    ConveyorModel.addInterface = function(name, $interface) {
      return this.interfaces[name] = $interface;
    };

    ConveyorModel.prototype.addInterface = function(name, $interface) {
      return this.interfaces[name] = $interface;
    };

    ConveyorModel.firstInterface = function(action) {
      var $intfc, x;
      for (x in this.interfaces) {
        $intfc = this.interfaces[x];
        if ($intfc.actions.indexOf(action) !== -1) {
          return $intfc;
        }
      }
      throw "No interface available with the ability to: " + action;
    };

    ConveyorModel.prototype.fields = {};

    ConveyorModel.primaryKey = 'id';

    ConveyorModel.index = {};

    return ConveyorModel;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.ConveyorModel = ConveyorModel;

}).call(this);

(function() {
  var ConveyorModelState, root;

  ConveyorModelState = (function() {
    function ConveyorModelState(value) {
      this.changed = false;
      this.timestamp = Date.now();
    }

    ConveyorModelState.prototype.undo = function() {};

    return ConveyorModelState;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.ConveyorModelState = ConveyorModelState;

}).call(this);

(function() {
  var ConveyorModelValueException, ConveyorValue, ConveyorValueCore, root,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ConveyorValueCore = (function() {
    ConveyorValueCore.transformers = [];

    function ConveyorValueCore(raw, model, conf) {
      this.model = model;
      this.conf = conf;
      this.current = null;
      this.dirty = false;
      this.saved = false;
      this.errors = [];
      this.history = [];
      this.$apply(raw, true);
    }

    ConveyorValueCore.prototype.get = function() {
      var val;
      val = null;
      this.$publish().then(function(value) {
        console.log('got', value);
        return val = value;
      });
      return val;
    };

    ConveyorValueCore.prototype.set = function(value) {
      return this.$apply(value);
    };

    ConveyorValueCore.prototype.$apply = function(value, force) {
      var original;
      if (force == null) {
        force = false;
      }
      this.raw = value;
      original = this.current;
      console.info('$apply', value);
      return ConveyorBelt.run(this, this.constructor.transformers, 'apply').then((function(_this) {
        return function(value) {
          console.info('$applied', value);
          if (value instanceof ConveyorValueCore) {
            _this.current = value.raw;
          } else {
            _this.current = value;
          }
          if (!force && _this.current !== original) {
            _this.dirty = true;
          }
          if (force) {
            return _this.dirty = false;
          }
        };
      })(this), function(err) {
        return this.exception(err);
      });
    };

    ConveyorValueCore.prototype.$publish = function() {
      return ConveyorBelt.run(this, this.constructor.transformers, 'publish').then(function(value) {
        console.info('$publish', value);
        if (value instanceof ConveyorValueCore) {
          return value.current;
        } else {
          return value;
        }
      }, function(err) {
        return this.exception(err);
      });
    };

    ConveyorValueCore.prototype.exception = function(message) {
      console.error(message);
      throw new ConveyorModelValueException(message, this);
    };

    return ConveyorValueCore;

  })();

  ConveyorValue = {};

  ConveyorValue.String = (function(superClass) {
    extend(String, superClass);

    function String() {
      return String.__super__.constructor.apply(this, arguments);
    }

    String.transformers = [
      (new ConveyorTransformer).onApply(function(value) {
        if (typeof value.raw === 'string') {
          return this.next(value.raw);
        }
        if (!value.raw) {
          return this.next('');
        }
        if (typeof value.raw === 'boolean') {
          return this.next(value.raw && (value.conf.boolTrue || '1') || (value.conf.boolFalse || '0'));
        }
        if (value.raw.toString != null) {
          return this.next(value.raw.toString());
        }
        return value.exception("ConveyorValue.String - Cannot convert value to string.");
      })
    ];

    return String;

  })(ConveyorValueCore);

  ConveyorValue.Number = (function(superClass) {
    extend(Number, superClass);

    function Number() {
      return Number.__super__.constructor.apply(this, arguments);
    }

    Number.transformers = [
      (new ConveyorTransformer).onApply(function(value) {
        if (typeof value.raw === 'boolean') {
          return this.next(value.raw && 1 || 0);
        }
        if (typeof value.raw === 'string') {
          if (value.raw.length === 0) {
            return this.next(0);
          }
          if (value.raw.match(/[^0-9$%#,.\s\r\n]/g)) {
            value.raw.exception("Cannot convert `" + value.raw + "` to a number.");
          }
          return this.next(parseFloat(value.raw.replace(/[^0-9\.]/g, '')));
        }
        if (value.raw instanceof Number || typeof value.raw === 'number') {
          return this.next(value.raw);
        }
        return value.exception("Cannot convert `" + value.raw + "` to a number.");
      })
    ];

    return Number;

  })(ConveyorValueCore);

  ConveyorValue.Boolean = (function(superClass) {
    extend(Boolean, superClass);

    function Boolean() {
      return Boolean.__super__.constructor.apply(this, arguments);
    }

    Boolean.transformers = [
      (new ConveyorTransformer).onApply(function(value) {
        if (typeof value.raw === 'boolean') {
          return this.next(value.raw);
        }
        if (typeof value.raw === 'string') {
          if (['yes', 'true', '1'].indexOf(value.raw) !== -1) {
            return this.next(true);
          }
          if (['no', 'false', '0'].indexOf(value.raw) !== -1) {
            return this.next(false);
          }
        }
        if (typeof value.raw === 'number') {
          return this.next(value.raw !== 0 && true || false);
        }
        return value.exception("Cannot convert `" + value.raw + "` to a boolean.");
      })
    ];

    return Boolean;

  })(ConveyorValueCore);

  ConveyorModelValueException = (function() {
    function ConveyorModelValueException(message1, value1) {
      this.message = message1;
      this.value = value1;
    }

    return ConveyorModelValueException;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.ConveyorValue = ConveyorValue;

}).call(this);

(function() {
  var ConveyorPromise;

  ConveyorPromise = (function() {
    ConveyorPromise.index = 0;

    function ConveyorPromise(executor, delay) {
      this._ref = this.constructor.index++;
      if (typeof executor === 'function') {
        this.executor = executor;
      } else {
        this.executor = null;
      }
      this.resolvers = [];
      this.rejecters = [];
      this.next = null;
      this.status = 0;
      this.value = null;
      if (!delay && typeof executor === 'function') {
        this.run();
      }
    }

    ConveyorPromise.prototype.then = function(success, fail) {
      var promise, temp;
      if (success instanceof ConveyorPromise) {
        temp = success;
        fail = function(err) {
          return temp.reject(err);
        };
        success = function(value) {
          return temp.resolve(value);
        };
      }
      if (this.status === 0) {
        promise = new ConveyorPromise;
        if (success) {
          success.$promise = promise;
          this.resolvers.push(success);
        }
        if (fail) {
          fail.$promise = promise;
          this.rejecters.push(fail);
        }
        return promise;
      }
      if (this.status === 1 && success) {
        return this._next(success.call(this, this.value));
      }
      if (this.status === -1 && fail) {
        return this._next(fail.call(this, this.value));
      }
      return this;
    };

    ConveyorPromise.prototype["catch"] = function(fail) {
      if (this.status === -1 && fail) {
        fail.call(this, value);
      }
      if (fail) {
        this.rejecters.push(fail);
      }
      return this;
    };

    ConveyorPromise.resolve = function(value) {
      var promise;
      promise = new ConveyorPromise;
      promise.status = 1;
      promise.value = value;
      return promise;
    };

    ConveyorPromise.reject = function(value) {
      var promise;
      promise = new ConveyorPromise;
      promise.status = -1;
      promise.value = value;
      return promise;
    };

    ConveyorPromise.prototype.resolve = function(value) {
      var fn, j, len, r, ref;
      if (this.status !== 0) {
        throw "This promise is already " + (this.status === -1 && 'rejected' || 'resolved') + ". Cannot resolve.";
      }
      this.value = value;
      this.status = 1;
      ref = this.resolvers;
      for (j = 0, len = ref.length; j < len; j++) {
        fn = ref[j];
        r = fn.call(this, value);
        if (fn.$promise != null) {
          fn.$promise._forward(r);
        }
      }
      return this;
    };

    ConveyorPromise.prototype.reject = function(value) {
      var fn, j, len, r, ref;
      if (this.status !== 0) {
        throw "This promise is already " + (this.status === -1 && 'rejected' || 'resolved') + ". Cannot reject.";
      }
      this.value = value;
      this.status = -1;
      ref = this.rejecters;
      for (j = 0, len = ref.length; j < len; j++) {
        fn = ref[j];
        r = fn.call(this, value);
        if (fn.$promise != null) {
          fn.$promise._forward(r);
        }
      }
      return this;
    };

    ConveyorPromise.prototype.run = function(excecutor) {
      if (typeof executor === 'function') {
        this.executor = executor;
      }
      if (typeof this.executor !== 'function') {
        throw "You can only call run on a promise if an executor is provided.";
      }
      return this.executor.call(this, this.resolve, this.reject);
    };

    ConveyorPromise.aggregate = function(arr, strict) {
      var agp, complete, done, failures, i, incr, j, len, promise, total;
      if (strict == null) {
        strict = false;
      }
      agp = new ConveyorPromise;
      done = 0;
      total = arr.length;
      failures = [];
      incr = function() {
        done++;
        if (done === total) {
          return complete();
        }
      };
      complete = function() {
        var errors, i, j, len, out, promise;
        out = [];
        errors = [];
        for (i = j = 0, len = arr.length; j < len; i = ++j) {
          promise = arr[i];
          if (promise.status === 1) {
            out.push(promise.value);
          } else {
            errors.push(promise.value);
          }
        }
        if (errors.length && !out.length) {
          return agp.reject(errors);
        }
        if (errors.length && strict) {
          return agp.reject(errors);
        }
        return agp.resolve(out);
      };
      for (i = j = 0, len = arr.length; j < len; i = ++j) {
        promise = arr[i];
        promise.then(incr, incr);
      }
      return agp;
    };

    ConveyorPromise.prototype._forward = function(value) {
      if (value instanceof ConveyorPromise) {
        return value.then((function(_this) {
          return function(success) {
            return _this.resolve(success);
          };
        })(this), function(err) {
          return this.reject(err);
        });
      } else {
        return this.resolve(value);
      }
    };

    ConveyorPromise.prototype._next = function(value) {
      if (value instanceof ConveyorPromise) {
        return value;
      } else {
        return ConveyorPromise.resolve(value);
      }
    };

    return ConveyorPromise;

  })();

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorPromise = ConveyorPromise;

}).call(this);
