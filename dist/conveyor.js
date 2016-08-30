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

    ConveyorUtil.escapeRegex = function(s) {
      return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
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

    ConveyorFacade.prototype.$dirty = false;

    function ConveyorFacade($model, transformer) {
      this.$model = $model;
      this.$$transformer = Conveyor.getTransformer(transformer);
      this.$apply();
    }

    ConveyorFacade.prototype.$apply = function() {
      var key;
      for (key in this.$model.fields) {
        this[key] = this.$model.get(key);
        if (this[key] instanceof ConveyorModel) {
          this[key] = new ConveyorFacade(this[key]);
        }
      }
      if (this.$$transformer) {
        ConveyorBelt.run(this, this.$$transformer, 'apply');
      }
      this.$dirty = this.$model.$isDirty();
      return this;
    };

    ConveyorFacade.prototype.$commit = function() {
      var key;
      for (key in this) {
        if (key.indexOf('$') === 0) {
          continue;
        }
        if (key === 'constructor') {
          continue;
        }
        this.$model.set(key, this[key]);
      }
      return this.$apply();
    };

    ConveyorFacade.prototype.$json = function() {
      var key, out;
      out = {};
      for (key in this) {
        if (key.indexOf('$') === 0) {
          continue;
        }
        if (key === 'constructor') {
          continue;
        }
        out[key] = this[key];
      }
      return out;
    };

    ConveyorFacade.prototype.$save = function(opts) {
      this.$commit();
      return this.$model.save(opts).then((function(_this) {
        return function() {
          return _this.$apply();
        };
      })(this));
    };

    ConveyorFacade.prototype.$fetch = function(opts) {
      this.$commit();
      return this.$model.fetch(opts).then((function(_this) {
        return function() {
          return _this.$apply();
        };
      })(this), function() {
        return console.info('Facade fetch failed');
      });
    };

    ConveyorFacade.prototype.$delete = function() {
      return this.$model.remove();
    };

    ConveyorFacade.prototype.$reset = function() {
      this.$model.reset();
      return this.$apply();
    };

    return ConveyorFacade;

  })();

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorFacade = ConveyorFacade;

}).call(this);

(function() {
  var ConveyorBelt;

  ConveyorBelt = (function() {
    function ConveyorBelt(data, transformers, direction, conf) {
      var i, j, rtmp, tmp;
      this.promise = new ConveyorPromise;
      this.data = data;
      this.extra = ConveyorUtil.obj(conf);
      tmp = transformers instanceof Array && transformers || [transformers];
      this.direction = direction || 'apply';
      if (this.direction === 'publish') {
        rtmp = [];
        for (j = tmp.length - 1; j >= 0; j += -1) {
          i = tmp[j];
          rtmp.push(i);
        }
        tmp = rtmp;
      }
      this.transformers = tmp;
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

    ConveyorBelt.run = function(d, t, dd, conf) {
      return (new ConveyorBelt(d, t, dd, conf)).promise;
    };

    ConveyorBelt.thread = function(arr, t, dd) {
      var d, j, len, promises;
      promises = [];
      for (j = 0, len = arr.length; j < len; j++) {
        d = arr[j];
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

    ConveyorHttpInterface.prototype.remove = function(data, conf) {
      var params, path, promise;
      promise = new ConveyorPromise;
      params = ConveyorUtil.extend({}, data, conf.params);
      path = this.$$path('remove')(params);
      this.$$req('delete', path).then((function(_this) {
        return function(data) {
          return promise.resolve(data);
        };
      })(this), function(xhr, status, err) {
        return promise.reject(err);
      });
      return promise;
    };

    ConveyorHttpInterface.prototype.list = function(conf) {
      var path, promise;
      conf = ConveyorUtil.obj(conf);
      promise = new ConveyorPromise;
      path = this.$$path('list')(ConveyorUtil.obj(conf.params));
      this.$$req('get', path, ConveyorUtil.obj(conf.data), conf.queue || null).then((function(_this) {
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

    ConveyorHttpInterface.prototype.fetch = function(data, conf) {
      var params, path, promise;
      conf = ConveyorUtil.obj(conf);
      params = ConveyorUtil.extend({}, data, conf.params);
      promise = new ConveyorPromise;
      path = this.$$path('fetch', conf.custom_path && conf.custom_path || false)(params);
      this.$$req('get', path, ConveyorUtil.obj(conf.data), conf.queue || null).then((function(_this) {
        return function(data) {
          return ConveyorBelt.run(data, _this.transformers, 'apply').then(promise);
        };
      })(this), function(xhr, status, err) {
        return promise.reject(err);
      });
      return promise;
    };

    ConveyorHttpInterface.prototype.save = function(data, conf) {
      var promise;
      promise = new ConveyorPromise;
      ConveyorBelt.run(data, this.transformers, 'publish', conf).then((function(_this) {
        return function(data) {
          var params, path;
          params = ConveyorUtil.extend({}, data, conf.params);
          path = _this.$$path('save', conf.custom_path && conf.custom_path || false)(params);
          return _this.$$req('put', path, data).then(function(data) {
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

    ConveyorHttpInterface.prototype.$$path = function(method, custom_path) {
      var out;
      out = '';
      if (custom_path && custom_path.indexOf('./') !== 0) {
        return this.$$interpolate(custom_path);
      }
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
      if (custom_path && custom_path.indexOf('./') === 0) {
        out += custom_path.substr(1);
      }
      if ((this.endpointExt != null) && typeof this.endpointExt === 'string') {
        out += this.endpointExt;
      }
      return this.$$interpolate(out);
    };

    ConveyorHttpInterface.prototype.queue_index = 0;

    ConveyorHttpInterface.prototype.queues = {};

    ConveyorHttpInterface.prototype.$$req = function(method, path, args, queue) {
      var req, ti, x;
      req = $.ajax({
        url: path,
        method: method,
        data: method !== 'get' && JSON.stringify(args) || args,
        contentType: 'application/json',
        dataType: 'json'
      });
      console.info('req', method, path, args, queue);
      if ((queue != null) && typeof queue === 'object') {
        if (this.queues[queue.id] == null) {
          this.queues[queue.id] = {
            length: 0
          };
        }
        if (queue.abort) {
          for (x in this.queues[queue.id]) {
            if (x === 'length') {
              continue;
            }
            console.error('aborting', this.queues[queue.id], x, queue.id);
            this.queues[queue.id][x].abort();
          }
        }
        ti = this.queue_index++;
        this.queues[queue.id][ti] = req;
        console.info('starting', this.queues[queue.id][ti], ti, queue.id);
        this.queues[queue.id].length++;
        req.always((function(_this) {
          return function() {
            console.warn('completing', _this.queues[queue.id][ti], ti, queue.id);
            if (_this.queues[queue.id][ti] != null) {
              _this.queues[queue.id].length--;
              return delete _this.queues[queue.id][ti];
            }
          };
        })(this));
      }
      return req;
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
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  ConveyorModel = (function(superClass) {

    /*
    This docstring documents MyClass. It can include *Markdown* syntax,
    which will be converted to html.
     */
    extend(ConveyorModel, superClass);

    ConveyorModel._refCount = 0;

    ConveyorModel.facade = ConveyorFacade;

    ConveyorModel.prototype.deleted = false;

    function ConveyorModel(data, conf) {
      this._ref = this.constructor._refCount++;
      this.data = {};
      this.conf = ConveyorUtil.obj(conf);
      this.interfaces = {};
      this.sync(data);
    }

    ConveyorModel.prototype.fetch = function(opts) {
      var data, t_opts, tmp;
      if ((opts != null ? opts.tmp : void 0) != null) {
        tmp = ConveyorUtil.obj(opts.tmp);
        delete opts.tmp;
      } else {
        tmp = {};
      }
      opts = ConveyorUtil.extend({}, this.conf, opts);
      t_opts = ConveyorUtil.extend({}, opts, tmp);
      data = this.$publish(opts.changed_only && true || false);
      console.info('fetch opts', t_opts, this.conf);
      if (this.getPrimaryKey()) {
        return this.allInterfaces('fetch', data, t_opts).then((function(_this) {
          return function(data) {
            return _this.sync(data[0], opts);
          };
        })(this), function() {});
      } else {
        throw "Cannot reload without a primary key";
      }
    };

    ConveyorModel.prototype.save = function(opts) {
      var data, t_opts, tmp;
      if ((opts != null ? opts.tmp : void 0) != null) {
        tmp = ConveyorUtil.obj(opts.tmp);
        delete opts.tmp;
      } else {
        tmp = {};
      }
      opts = ConveyorUtil.extend({}, this.conf, opts);
      t_opts = ConveyorUtil.extend({}, opts, tmp);
      data = this.$publish(opts.changed_only && true || false);
      if (this.getPrimaryKey()) {
        return this.allInterfaces('save', data, t_opts).then((function(_this) {
          return function(data) {
            return _this.sync(data[0], opts);
          };
        })(this));
      } else {
        return this.allInterfaces('create', data, t_opts).then((function(_this) {
          return function(data) {
            return _this.sync(data[0], opts);
          };
        })(this));
      }
    };

    ConveyorModel.prototype.remove = function(opts) {
      var data;
      opts = ConveyorUtil.extend({}, this.conf, opts);
      data = this.$publish(opts.changed_only && true || false);
      if (this.getPrimaryKey()) {
        return this.allInterfaces('remove', data, opts).then((function(_this) {
          return function(data) {
            return _this.deleted = true;
          };
        })(this));
      } else {
        throw "no primary key, can't delete";
      }
    };

    ConveyorModel.prototype.getPrimaryKey = function() {
      return this.get(this.constructor.primaryKey);
    };

    ConveyorModel.list = function(args, conf) {
      var t_conf, tmp;
      if (typeof conf !== 'object') {
        conf = {};
      }
      conf.data = args;
      if (conf.tmp != null) {
        tmp = ConveyorUtil.obj(conf.tmp);
        delete conf.tmp;
      } else {
        tmp = {};
      }
      t_conf = ConveyorUtil.extend({}, conf, tmp);
      return this.firstInterface('list', t_conf).then((function(_this) {
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

    ConveyorModel.get = function(pk, conf) {
      var promise;
      promise = new ConveyorPromise;
      if (typeof pk === 'object') {
        promise.resolve(this.sync(data, conf));
      } else if (typeof pk === 'number') {
        if (this.index[this.name + "_" + pk]) {
          promise.resolve(this.index[this.name + "_" + pk]);
        } else {
          conf = ConveyorUtil.obj(conf);
          conf.params = ConveyorUtil.obj(conf.params);
          conf.params.id = pk;
          this.firstInterface('fetch', conf).then((function(_this) {
            return function(obj) {
              return promise.resolve(_this.sync(obj, conf));
            };
          })(this), function(err) {
            return promise.reject(err);
          });
        }
      } else {
        promise.reject("invalid model ref");
      }
      return promise;
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
        return this.index[this.name + "_" + pk].sync(data, conf);
      }
    };

    ConveyorModel.prototype.sync = function(data, opts) {
      var conf, force, key, val;
      data = ConveyorUtil.obj(data);
      ConveyorUtil.extend(this.conf, opts);
      force = data[this.constructor.primaryKey] != null;
      for (key in this.fields) {
        conf = this.fields[key];
        if (data[key] == null) {
          continue;
        }
        val = data[key];
        if ((this.data[key] != null) && this.data[key] instanceof ConveyorValueCore) {
          this.data[key].set(val, true);
        } else if ((conf != null ? conf.type : void 0) != null) {
          if (conf.type instanceof ConveyorValueCore) {
            this.data[key] = new conf.type(val, key, this, conf, force);
          } else if (ConveyorValue[conf.type] != null) {
            this.data[key] = new ConveyorValue[conf.type](val, key, this, conf, force);
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

    ConveyorModel.prototype.val = function(key) {
      if (this.data[key]) {
        return this.data[key];
      } else {
        return null;
      }
    };

    ConveyorModel.prototype.get = function(key) {
      if (this.data[key]) {
        return this.data[key].get();
      } else {
        return null;
      }
    };

    ConveyorModel.prototype.set = function(key, value, force) {
      var conf;
      if (force == null) {
        force = false;
      }
      if (this.data[key]) {
        return this.data[key].set(value, force);
      } else if (this.fields[key] != null) {
        conf = this.fields[key];
        if (conf.type instanceof ConveyorValueCore) {
          return this.data[key] = new conf.type(value, key, this, conf, force);
        } else if (ConveyorValue[conf.type] != null) {
          return this.data[key] = new ConveyorValue[conf.type](value, key, this, conf, force);
        } else {
          return console.error('ConveyorModelValue::' + conf.type + ' is not a valid value type.');
        }
      }
    };

    ConveyorModel.prototype.$facade = function(tr) {
      return new this.constructor.facade(this, tr);
    };

    ConveyorModel.prototype.$isDirty = function() {
      var item;
      for (item in this.data) {
        if (this.data[item].dirty) {
          return true;
        }
      }
      return false;
    };

    ConveyorModel.prototype.reset = function() {
      var item, results;
      results = [];
      for (item in this.data) {
        if (this.data[item].dirty) {
          results.push(this.data[item].reset());
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    ConveyorModel._collectionize = function(arr) {
      var me, out;
      arr.$changed = function() {
        return this.filter(function(model) {
          return model.dirty;
        });
      };
      out = [];
      me = this;
      arr.$facade = function(tr) {
        var i, j, len;
        out = [];
        out.$json = function() {
          var j, len, rout, x;
          rout = [];
          for (j = 0, len = this.length; j < len; j++) {
            x = this[j];
            rout.push(x.$json());
          }
          return rout;
        };
        for (j = 0, len = this.length; j < len; j++) {
          i = this[j];
          out.push(new me.facade(i, tr));
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

  })(ConveyorBase);

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

    ConveyorValueCore.prototype.$init = null;

    ConveyorValueCore.prototype.immutable = false;

    ConveyorValueCore.prototype.forced = false;

    ConveyorValueCore.prototype.nullable = true;

    ConveyorValueCore.prototype.empty_value = null;

    function ConveyorValueCore(raw, key, model1, conf, force) {
      this.key = key;
      this.model = model1;
      this.conf = conf;
      if (force == null) {
        force = true;
      }
      if (this.conf.immutable) {
        this.immutable = true;
      }
      if (this.conf.nullable != null) {
        this.nullable = this.conf.nullable;
      }
      if (this.conf.empty_value !== void 0) {
        this.empty_value = this.conf.empty_value;
      }
      this.current = null;
      this.dirty = false;
      this.saved = false;
      this.errors = [];
      this.history = [];
      this.$apply(raw, force).then((function(_this) {
        return function() {
          if (typeof _this.$init === 'function') {
            return _this.$init();
          }
        };
      })(this));
    }

    ConveyorValueCore.prototype.get = function() {
      return this.current;
    };

    ConveyorValueCore.prototype.set = function(value, force) {
      if (force == null) {
        force = false;
      }
      return this.$apply(value, force);
    };

    ConveyorValueCore.prototype.reset = function() {
      if (this.dirty && this.history.length > 1 && this.forced) {
        return this.$apply(this.history[0], true);
      } else {
        return this.$apply(null, true);
      }
    };

    ConveyorValueCore.prototype.undo = function() {
      if (this.dirty && this.history.length > 1) {
        return this.$apply(this.history[this.history.length - 1], true);
      }
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

    ConveyorValueCore.prototype.$diff = function(a, b) {
      return a !== b;
    };

    ConveyorValueCore.prototype.$apply = function(value, force) {
      var cb, original;
      if (force == null) {
        force = false;
      }
      if (this.immutable && !force && this.history.length) {
        return ConveyorPromise.reject();
      }
      if (force) {
        this.forced = true;
      }
      if (value === null) {
        if (!this.nullable && this.empty_value !== null) {
          value = this.empty_value;
        } else if (!this.nullable) {
          throw this.key + " cannot be set to null";
        }
      }
      this.raw = value;
      original = this.current;
      cb = (function(_this) {
        return function(value) {
          if (value instanceof ConveyorValueCore) {
            _this.current = value.raw;
          } else {
            _this.current = value;
          }
          if (!force && _this.$diff(_this.current, original)) {
            _this.dirty = true;
            _this.history.push(original);
            _this.model.$trigger("change:" + _this.key, _this);
          }
          if (force) {
            _this.dirty = false;
            _this.history = [];
            _this.model.$trigger("change:" + _this.key, _this);
          }
          return _this;
        };
      })(this);
      if (value === null) {
        return ConveyorPromise.resolve(cb(null));
      } else {
        return ConveyorBelt.run(this, this.constructor.transformers, 'apply').then(cb, function(err) {
          return this.exception(err);
        });
      }
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

    String.prototype.empty_value = '';

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

    Number.prototype.empty_value = 0;

    Number.onApply(function(value) {
      if (typeof value.raw === 'boolean') {
        return this.next(value.raw && 1 || 0);
      }
      if (typeof value.raw === 'string') {
        if (value.raw.length === 0) {
          return this.next(0);
        }
        if (value.raw.match(/[^0-9$%#,.\s\r\n]/g)) {
          value.exception("Cannot convert `" + value.raw + "` to a number.");
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

    Currency.prototype.empty_value = 0;

    Currency.onApply(function(value) {
      if (typeof value.raw === 'string') {
        if (value.raw.length === 0) {
          return this.next(0);
        }
        if (value.raw.match(/[^0-9$%#,.\s\r\n]/g)) {
          value.exception("Cannot convert `" + value.raw + "` to a number.");
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

    Boolean.prototype.empty_value = false;

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

  ConveyorValue.Raw = (function(superClass) {
    extend(Raw, superClass);

    function Raw() {
      return Raw.__super__.constructor.apply(this, arguments);
    }

    return Raw;

  })(ConveyorValueCore);

  ConveyorValue.Model = (function(superClass) {
    extend(Model, superClass);

    function Model() {
      return Model.__super__.constructor.apply(this, arguments);
    }

    Model.prototype.immutable = true;

    Model.prototype.$init = function() {
      if (this.conf.on) {
        return this.model.$on("change:" + this.conf.on, (function(_this) {
          return function(value) {
            return _this.$apply(value.get(), true);
          };
        })(this));
      }
    };

    Model.onApply(function(value, pipe) {
      var nm, ref;
      if (value.conf.on) {
        ref = value.model.get(value.conf.on);
      }
      if (typeof value.raw === 'object') {
        nm = value.conf.model.sync(value.raw);
        if (value.conf.on && !ref) {
          value.model.set(value.conf.on, nm.getPrimaryKey());
        }
        return this.next(nm);
      }
      if (typeof value.raw === 'number') {
        if (value.current instanceof ConveyorModel) {
          if (value.current.getPrimaryKey() !== value.raw) {
            value.conf.model.get(value.raw).then((function(_this) {
              return function(model) {
                console.warn(model);
                return _this.next(model);
              };
            })(this), function(err) {
              throw err;
            });
            return;
          } else {
            return this.next(value.current);
          }
        } else {
          value.conf.model.get(value.raw).then((function(_this) {
            return function(model) {
              return _this.next(model);
            };
          })(this), function(err) {
            throw err;
          });
          return;
        }
      }
      return this.next(value.raw);
    });

    Model.onPublish(function(value) {
      if (value.current instanceof ConveyorModel) {
        return this.next(value.current.getPrimaryKey());
      }
      return this.next(value.current);
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
        return this._next(fail.call(this, this.value), true);
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
          fn.$promise._forward(r, true);
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
        console.info("completing aggregate with " + errors.length + " errors and " + out.length + " good");
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
      if (arr.length === 0) {
        complete();
      }
      return agp;
    };

    ConveyorPromise.prototype._forward = function(value, fail) {
      if (fail == null) {
        fail = false;
      }
      if (value instanceof ConveyorPromise) {
        return value.then((function(_this) {
          return function(success) {
            return _this.resolve(success);
          };
        })(this), (function(_this) {
          return function(err) {
            return _this.reject(err);
          };
        })(this));
      } else {
        if (fail) {
          return this.reject(value);
        } else {
          return this.resolve(value);
        }
      }
    };

    ConveyorPromise.prototype._next = function(value, fail) {
      if (fail == null) {
        fail = false;
      }
      if (value instanceof ConveyorPromise) {
        return value;
      } else {
        if (fail) {
          return ConveyorPromise.reject(value);
        } else {
          return ConveyorPromise.resolve(value);
        }
      }
    };

    return ConveyorPromise;

  })();

  (typeof exports !== "undefined" && exports !== null ? exports : this).ConveyorPromise = ConveyorPromise;

}).call(this);
