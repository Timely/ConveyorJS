class ConveyorModelState
  constructor: (value)->
    @changed = false;
    @timestamp = Date.now()
  undo: ->


root = exports ? window
root.ConveyorModelState = ConveyorModelState