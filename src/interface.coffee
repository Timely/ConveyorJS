class ConveyorInterface extends ConveyorBase
  constructor: (@options)->
  save: (model)->
    data = model.state.snapshot()
    belt = new ConveyorBelt 'publish', @.transformers, data
    belt.promise
  $remove: ->
  $list: ->
  $create: ->

root = exports ? window
root.ConveyorInterface = ConveyorInterface