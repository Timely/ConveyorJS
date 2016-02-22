(function() {
  var ConveyorBase, ConveyorUtil,
    slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ConveyorUtil = (function() {
    function ConveyorUtil() {}

    ConveyorUtil.extend = function() {
      var base, ext, i, len, obj, x;
      base = arguments[0], ext = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      base = this.obj(base);
      for (i = 0, len = ext.length; i < len; i++) {
        obj = ext[i];
        if (typeof obj === 'object') {
          for (x in obj) {
            base[x] = obj[x];
          }
        }
      }
      return base;
    };

    ConveyorUtil.obj = function(val, def) {
      if (typeof val === 'object') {
        return val;
      }
      if (typeof def === 'object') {
        return def;
      }
      return {};
    };

    ConveyorUtil.prototype.$$arrayForEach = function(a, cb) {
      if (!Array.isArray(a)) {
        throw "$arrayForEach expects an array, given: " + (typeof a);
      }
      return a.length;
    };

    ConveyorUtil.prototype.$on = function(ev, handler) {
      if (this.__eventHandlers == null) {
        this.__eventHandlers = {};
      }
      if (this.__eventHandlers[ev] == null) {
        this.__eventHandlers[ev] = [];
      }
      return this.__eventHandlers[ev].push(handler);
    };

    ConveyorUtil.prototype.$trigger = function() {
      var args, ev, i, len, ref, results, x;
      ev = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (this.__eventHandlers == null) {
        return;
      }
      if (this.__eventHandlers[ev] == null) {
        return;
      }
      ref = this.__eventHandlers[ev];
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        x = ref[i];
        if (typeof x === 'function') {
          results.push(x.apply(this, args));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    ConveyorUtil.prototype.$$interpolate = (function() {
      var rc;
      rc = {
        '\n': '\\n',
        '"': '\"',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029'
      };
      return function(str) {
        return new Function('o', 'return "' + str.replace(/["\n\r\u2028\u2029]/g, function($0) {
          return rc[$0];
        }).replace(/\{([\s\S]+?)\}/g, '" + o["$1"] + "') + '";');
      };
    })();

    return ConveyorUtil;

  })();

  ConveyorBase = (function(superClass) {
    extend(ConveyorBase, superClass);

    function ConveyorBase() {
      return ConveyorBase.__super__.constructor.apply(this, arguments);
    }

    ConveyorBase.prototype.$$apply = function(fn, args) {
      return this[fn].apply(this, args);
    };

    ConveyorBase.prototype.$$call = function() {
      var args, fn;
      fn = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return this[fn].apply(this, args);
    };

    ConveyorBase.prototype.$$setDefaults = function(base, opts) {
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
      this.$$setDefaults({
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
      } else {
        return belt.next(data);
      }
    };

    ConveyorTransformer.prototype.$publish = function(data, belt) {
      if (this._publisher) {
        return this._publisher.call(belt, data);
      } else {
        return belt.next(data);
      }
    };

    return ConveyorTransformer;

  })(ConveyorBase);

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.ConveyorTransformer = ConveyorTransformer;

}).call(this);

(function() {
  var ConveyorFacade;

  ConveyorFacade = (function() {
    ConveyorFacade.prototype.$$transformer = null;

    function ConveyorFacade($model, transformer) {
      this.$model = $model;
      this.$$transformer = Conveyor.getTransformer(transformer);
      this.$$apply();
    }

    ConveyorFacade.prototype.$$apply = function() {
      var key;
      for (key in this.$model.data) {
        this[key] = this.$model.get(key);
        if (this[key] instanceof ConveyorModel) {
          this[key] = new ConveyorFacade(this[key]);
        }
      }
      if (this.$$transformer) {
        ConveyorBelt.run(this, this.$$transformer, 'apply');
      }
      return this;
    };

    ConveyorFacade.prototype.$commit = function() {
      var key, results;
      results = [];
      for (key in this) {
        if (key.indexOf('$') === 0) {
          continue;
        }
        results.push(this.$model.set(key, this[key]));
      }
      return results;
    };

    ConveyorFacade.prototype.$save = function(opts) {
      this.$commit();
      return this.$model.save(opts).then((function(_this) {
        return function() {
          return _this.$$apply();
        };
      })(this));
    };

    ConveyorFacade.prototype.$delete = function() {
      return this.$model.remove();
    };

    return ConveyorFacade;

  })();

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorFacade = ConveyorFacade;

}).call(this);

(function() {
  var ConveyorBelt;

  ConveyorBelt = (function() {
    function ConveyorBelt(data, transformers, direction) {
      this.promise = new ConveyorPromise;
      this.data = data;
      this.transformers = transformers instanceof Array && transformers || [transformers];
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
      return Conveyor.__super__.constructor.apply(this, arguments);
    }

    Conveyor.transformers = {};

    Conveyor.models = {};

    Conveyor.interfaces = {};

    Conveyor.registerTransformer = function(name, apply, publish) {
      return this.transformers[name] = this.Transformer(apply, publish);
    };

    Conveyor.getTransformer = function(nameOrFunc) {
      if (typeof nameOrFunc === 'function') {
        return nameOrFunc;
      } else if (this.transformers[nameOrFunc]) {
        return this.transformers[nameOrFunc];
      }
    };

    Conveyor.Transformer = function(apply, publish) {
      var tr;
      tr = new ConveyorTransformer;
      if (typeof apply === 'function') {
        tr.onApply(apply);
      }
      if (typeof publish === 'function') {
        tr.onPublish(publish);
      }
      return tr;
    };

    Conveyor.prototype.registerModel = function() {};

    Conveyor.prototype.registerInterface = function() {};

    return Conveyor;

  })(ConveyorBase);

  (typeof exports !== "undefined" && exports !== null ? exports : this).Conveyor = (typeof exports !== "undefined" && exports !== null ? exports : this).CV = Conveyor;

}).call(this);

(function() {
  var ConveyorAngularFacade,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ConveyorAngularFacade = (function(superClass) {
    extend(ConveyorAngularFacade, superClass);

    function ConveyorAngularFacade() {
      return ConveyorAngularFacade.__super__.constructor.apply(this, arguments);
    }

    return ConveyorAngularFacade;

  })(ConveyorFacade);

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorAngularFacade = ConveyorAngularFacade;

}).call(this);

(function() {
  var ConveyorHttpInterface,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ConveyorHttpInterface = (function(superClass) {
    extend(ConveyorHttpInterface, superClass);

    function ConveyorHttpInterface(options) {
      this.$$setDefaults({
        endpoint: null,
        endpointExt: null,
        actions: [],
        transformers: [],
        listTransformers: []
      }, options);
    }

    ConveyorHttpInterface.prototype.fetch = function() {};

    ConveyorHttpInterface.prototype.remove = function() {};

    ConveyorHttpInterface.prototype.list = function(conf) {
      var path, promise;
      conf = ConveyorUtil.obj(conf);
      promise = new ConveyorPromise;
      path = this.$$path('list')(ConveyorUtil.obj(conf.params));
      this.$$req('get', path, ConveyorUtil.obj(conf.data)).then((function(_this) {
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

    ConveyorHttpInterface.prototype.save = function(data, conf) {
      var promise;
      promise = new ConveyorPromise;
      ConveyorBelt.run(data, this.transformers, 'publish').then((function(_this) {
        return function(data) {
          var params, path;
          params = ConveyorUtil.extend({}, data, conf.params);
          path = _this.$$path('save')(params);
          console.info(data);
          return _this.$$req('put', path, data).then(function(data) {
            console.info('saved', data);
            return ConveyorBelt.run(data, _this.transformers, 'apply').then(promise);
          }, function(xhr, status, err) {
            return promise.reject(err);
          });
        };
      })(this), function(err) {
        return promise.reject(err);
      });
      return promise;
    };

    ConveyorHttpInterface.prototype.create = function(data, conf) {
      var promise;
      promise = new ConveyorPromise;
      ConveyorBelt.run(data, this.transformers, 'publish').then((function(_this) {
        return function(data) {
          var params, path;
          params = ConveyorUtil.extend({}, data, conf.params);
          path = _this.$$path('create')(params);
          console.info('creating with', data);
          return _this.$$req('post', path, data).then(function(data) {
            return ConveyorBelt.run(data, _this.transformers, 'apply').then(promise);
          }, function(xhr, status, err) {
            return promise.reject(err);
          });
        };
      })(this), function(err) {
        return promise.reject(err);
      });
      return promise;
    };

    ConveyorHttpInterface.prototype.$$path = function(method) {
      var out;
      out = '';
      if (typeof this.endpoint === 'object') {
        if (this.endpoint[method] != null) {
          out = this.endpoint[method];
        } else if (['remove', 'save'].indexOf(this.endpoint[method]) !== -1 && (this.endpoint['fetch'] != null)) {
          out = this.endpoint['fetch'];
        } else if (method === 'create' && (this.endpoint['list'] != null)) {
          out = this.endpoint['list'];
        } else {
          throw "No valid endpoint for " + method + ".";
        }
      } else if (typeof this.endpoint === 'string') {
        if (['list', 'create'].indexOf(method) !== -1) {
          out = this.endpoint;
        } else {
          out = this.endpoint + '/{id}';
        }
      } else {
        throw "No valid endpoint for " + method + ".";
      }
      if ((this.endpointExt != null) && typeof this.endpointExt === 'string') {
        out += this.endpointExt;
      }
      return this.$$interpolate(out);
    };

    ConveyorHttpInterface.prototype.$$req = function(method, path, args) {
      return $.ajax({
        url: path,
        method: method,
        data: method !== 'get' && JSON.stringify(args) || args,
        contentType: 'application/json',
        dataType: 'json'
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
  var ConveyorModel, root,
    slice = [].slice;

  ConveyorModel = (function() {

    /*
    This docstring documents MyClass. It can include *Markdown* syntax,
    which will be converted to html.
     */
    ConveyorModel._refCount = 0;

    function ConveyorModel(data, conf) {
      this._ref = this.constructor._refCount++;
      this.data = {};
      this.conf = ConveyorUtil.obj(conf);
      this.interfaces = {};
      this.sync(data);
    }

    ConveyorModel.prototype.save = function(opts) {
      var data;
      opts = ConveyorUtil.extend({}, this.conf, opts);
      data = this.$publish(opts.changed_only && true || false);
      if (this.getPrimaryKey()) {
        return this.allInterfaces('save', data, opts).then((function(_this) {
          return function(data) {
            return _this.sync(data);
          };
        })(this));
      } else {
        return this.allInterfaces('create', data, opts).then((function(_this) {
          return function(data) {
            console.info('syncing new data', data);
            return _this.sync(data[0]);
          };
        })(this));
      }
    };

    ConveyorModel.prototype.remove = function() {};

    ConveyorModel.prototype.getPrimaryKey = function() {
      return this.get(this.constructor.primaryKey);
    };

    ConveyorModel.list = function(args, conf) {
      if (typeof conf !== 'object') {
        conf = {};
      }
      conf.data = args;
      return this.firstInterface('list', conf).then((function(_this) {
        return function(arr) {
          var hm, item, j, len, out;
          out = [];
          for (j = 0, len = arr.length; j < len; j++) {
            item = arr[j];
            out.push(_this.sync(item, conf));
          }
          return hm = _this._collectionize(out);
        };
      })(this));
    };

    ConveyorModel.sync = function(data, conf) {
      var pk;
      pk = data[this.primaryKey];
      if (!pk) {
        throw "You can only sync models with a primary key.";
      }
      if (this.index[this.name + "_" + pk] == null) {
        return this.index[this.name + "_" + pk] = new this.$self(data, conf);
      } else {
        return this.index[this.name + "_" + pk].sync(data);
      }
    };

    ConveyorModel.prototype.sync = function(data) {
      var conf, key, val;
      data = ConveyorUtil.obj(data);
      for (key in this.fields) {
        conf = this.fields[key];
        if (data[key] == null) {
          continue;
        }
        val = data[key];
        if ((conf != null ? conf.type : void 0) != null) {
          if (conf.type instanceof ConveyorValueCore) {
            this.data[key] = new conf.type;
          } else if (ConveyorValue[conf.type] != null) {
            this.data[key] = new ConveyorValue[conf.type](val, this, conf);
          } else {
            console.error('ConveyorModelValue::' + conf.type + ' is not a valid value type.');
          }
        }
        if (this.data[key] == null) {
          console.warn('ConveyorModel::constructor ignoring key: ', key, data[key]);
        }
      }
      return this;
    };

    ConveyorModel.prototype.$publish = function(changed) {
      var key, out;
      if (changed == null) {
        changed = false;
      }
      out = {};
      for (key in this.data) {
        if (changed) {
          if (this.data[key].dirty) {
            out[key] = this.data[key].$publish();
          }
        } else {
          out[key] = this.data[key].$publish();
        }
      }
      return out;
    };

    ConveyorModel.prototype.get = function(key) {
      if (this.data[key]) {
        return this.data[key].get();
      } else {
        return null;
      }
    };

    ConveyorModel.prototype.set = function(key, value) {
      var conf;
      if (this.data[key]) {
        return this.data[key].set(value);
      } else if (this.fields[key] != null) {
        conf = this.fields[key];
        if (conf.type instanceof ConveyorValueCore) {
          return this.data[key] = new conf.type;
        } else if (ConveyorValue[conf.type] != null) {
          return this.data[key] = new ConveyorValue[conf.type](value, this, conf);
        } else {
          return console.error('ConveyorModelValue::' + conf.type + ' is not a valid value type.');
        }
      }
    };

    ConveyorModel.prototype.$facade = function(tr) {
      return new ConveyorFacade(this, tr);
    };

    ConveyorModel._collectionize = function(arr) {
      var out;
      arr.$changed = function() {
        return this.filter(function(model) {
          return model.dirty;
        });
      };
      out = [];
      arr.$facade = function(tr) {
        var i, j, len;
        out = [];
        for (j = 0, len = this.length; j < len; j++) {
          i = this[j];
          out.push(new ConveyorFacade(i, tr));
        }
        return out;
      };
      return arr;
    };

    ConveyorModel.create = function(params) {};

    ConveyorModel.addInterface = function(name, $interface) {
      return this.interfaces[name] = $interface;
    };

    ConveyorModel.prototype.addInterface = function(name, $interface) {
      return this.constructor.interfaces[name] = $interface;
    };

    ConveyorModel.prototype.allInterfaces = function() {
      var $intfc, action, all, args, interfaces, x;
      action = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      interfaces = ConveyorUtil.obj(this.constructor.interfaces);
      all = [];
      for (x in interfaces) {
        $intfc = interfaces[x];
        if ($intfc.actions.indexOf(action) !== -1) {
          all.push($intfc.$$apply(action, args));
        }
      }
      if (!all.length) {
        throw "No interface available with the ability to: " + action;
      }
      return ConveyorPromise.aggregate(all);
    };

    ConveyorModel.firstInterface = function() {
      var $intfc, action, args, x;
      action = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      for (x in this.interfaces) {
        $intfc = this.interfaces[x];
        if ($intfc.actions.indexOf(action) !== -1) {
          return $intfc.$$apply(action, args);
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
      return this.current;
    };

    ConveyorValueCore.prototype.set = function(value) {
      return this.$apply(value);
    };

    ConveyorValueCore.onApply = function(fn) {
      var tr;
      tr = Conveyor.Transformer(fn);
      if (this.transformers.length) {
        return this.transformers.push(tr);
      } else {
        return this.transformers = [tr];
      }
    };

    ConveyorValueCore.onPublish = function(fn) {
      var tr;
      tr = Conveyor.Transformer(null, fn);
      if (this.transformers.length) {
        return this.transformers.push(tr);
      } else {
        return this.transformers = [tr];
      }
    };

    ConveyorValueCore.prototype.$apply = function(value, force) {
      var original;
      if (force == null) {
        force = false;
      }
      this.raw = value;
      original = this.current;
      return ConveyorBelt.run(this, this.constructor.transformers, 'apply').then((function(_this) {
        return function(value) {
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
      var out;
      out = null;
      ConveyorBelt.run(this, this.constructor.transformers, 'publish').then(function(value) {
        if (value instanceof ConveyorValueCore) {
          return out = value.current;
        } else {
          return out = value;
        }
      }, function(err) {
        return this.exception(err);
      });
      return out;
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

    String.onApply(function(value) {
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
    });

    return String;

  })(ConveyorValueCore);

  ConveyorValue.Number = (function(superClass) {
    extend(Number, superClass);

    function Number() {
      return Number.__super__.constructor.apply(this, arguments);
    }

    Number.onApply(function(value) {
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
    });

    return Number;

  })(ConveyorValueCore);

  ConveyorValue.Currency = (function(superClass) {
    extend(Currency, superClass);

    function Currency() {
      return Currency.__super__.constructor.apply(this, arguments);
    }

    Currency.onApply(function(value) {
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
    });

    return Currency;

  })(ConveyorValueCore);

  ConveyorValue.Boolean = (function(superClass) {
    extend(Boolean, superClass);

    function Boolean() {
      return Boolean.__super__.constructor.apply(this, arguments);
    }

    Boolean.onApply(function(value) {
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
    });

    return Boolean;

  })(ConveyorValueCore);

  ConveyorValue.Model = (function(superClass) {
    extend(Model, superClass);

    function Model() {
      return Model.__super__.constructor.apply(this, arguments);
    }

    Model.onApply(function(value) {
      if (typeof value.raw === 'object') {
        return this.next(new value.conf.model(value.raw));
      }
      return this.next(value.raw);
    });

    return Model;

  })(ConveyorValueCore);

  ConveyorModelValueException = (function() {
    function ConveyorModelValueException(message1, value1) {
      this.message = message1;
      this.value = value1;
    }

    return ConveyorModelValueException;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.ConveyorValueCore = ConveyorValueCore;

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
      this.$list = [];
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
        console.error('test');
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
