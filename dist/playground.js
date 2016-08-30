(function() {
  var $app, EventModel,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  $app = new Conveyor;

  $app.registerTransformer('api-unwrap').onApply(function(belt, value) {
    return belt.next(value.data);
  });

  EventModel = (function(superClass) {
    extend(EventModel, superClass);

    function EventModel() {
      return EventModel.__super__.constructor.apply(this, arguments);
    }

    EventModel.$self = EventModel;

    EventModel.interfaces = {
      api: new ConveyorHttpInterface({
        endpoint: './data/collection.json',
        actions: ['save', 'remove', 'list', 'fetch', 'create'],
        listTransformers: [],
        transformers: [
          (new ConveyorTransformer).onApply(function(value) {
            value.rssef = value.id + 100;
            return this.next(value);
          })
        ]
      })
    };

    EventModel.prototype.fields = {
      id: {
        type: 'Number'
      },
      ref: {
        type: 'Number'
      },
      name: {
        type: 'String'
      },
      start_date: {
        type: Date,
        transformers: 'viewDate'
      }
    };

    return EventModel;

  })(ConveyorModel);

  EventModel.list({
    before: new Date
  }).then(function(v) {
    return window.test = v[0];
  }, function(err) {
    return console.error(err);
  });

}).call(this);
