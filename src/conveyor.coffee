class Conveyor extends ConveyorBase

  @transformers: {}
  @models: {}
  @interfaces: {}
  @registerTransformer: (name, apply, publish)->
    @transformers[name] = @Transformer apply, publish
  @getTransformer: (nameOrFunc)->
    if typeof nameOrFunc is 'function'
      return nameOrFunc
    else if @transformers[nameOrFunc] 
      return @transformers[nameOrFunc]
  @Transformer: (apply, publish)->
    tr = new ConveyorTransformer
    if typeof apply is 'function'
      tr.onApply apply
    if typeof publish is 'function'
      tr.onPublish publish
    tr

  registerModel: ->
  registerInterface: ->



(exports ? this).Conveyor = (exports ? this).CV = Conveyor