class ConveyorTransformer extends ConveyorBase
  constructor: (opts)->
    @$$setDefaults
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
    else
      belt.next data
    
  $publish: (data,belt)->
    if @_publisher
      @_publisher.call belt, data
    else
      belt.next data


root = exports ? window
root.ConveyorTransformer = ConveyorTransformer