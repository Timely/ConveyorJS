class Conveyor extends ConveyorBase
  constructor: ->
    @_setDefaults
      transformers: {}
      models: {}
      interfaces: {}
  registerTransformer: (name)->
    @transformers[name] = new ConveyorTransformer

  registerModel: ->
  registerInterface: ->



(exports ? this).Conveyor = Conveyor