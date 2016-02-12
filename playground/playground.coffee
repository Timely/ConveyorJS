$app = new Conveyor

$app.registerTransformer('api-unwrap')
  .onApply (belt,value)->
    belt.next value.data

class EventModel extends ConveyorModel
  @$self = EventModel
  @interfaces:
    api: new ConveyorHttpInterface
      endpoint: './data/collection.json'
      actions: ['save','remove','list','fetch','create']
      listTransformers: []
      transformers: [
        (new ConveyorTransformer).onApply (value)->
          value.rssef = value.id+100
          this.next value
      ]
    # socketio:
    #   type: SocketIoInterface
    #   actions: ['push']
  fields:
    id: type: 'Number'
    ref: type: 'Number'
    name: type: 'String'
    start_date:
      type: Date
      transformers: 'viewDate'

# window.EventModel = EventModel

EventModel.list(before:new Date).then (v)->
  console.log 'data'
  window.test = v[0]
, (err)->
  console.error err
