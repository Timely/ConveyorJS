class ConveyorTransformer extends ConveyorBase
  constructor: (opts)->
    @_setDefaults
      _applier: null
      models: {}
      _publisher: null
    if opts
      if opts.onApply
        @_applier = opts.onApply
      if opts.onPublish
        @_publisher = opts.onPublish
  onApply: (fn)->
    @_applier = fn
    @
  onPublish: (fn)->
    @_publisher = fn
    @
  $apply: (data,belt)->
    if @_applier
      @_applier.call belt, data
    
  $publish: (data,belt)->
    if @_publisher
      @_publisher.call belt, data


root = exports ? window
root.ConveyorTransformer = ConveyorTransformer