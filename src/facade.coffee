class ConveyorFacade
  $$transformer: null
  $dirty: false
  constructor: (@$model, transformer)->
    @$$transformer = Conveyor.getTransformer transformer
    @$apply()
  $apply: ->
    for key of @$model.fields
      @[key] = @$model.get key
      if @[key] instanceof ConveyorModel
        @[key] = new ConveyorFacade @[key]
    if @$$transformer
      ConveyorBelt.run @, @$$transformer, 'apply'
    @$dirty = @$model.$isDirty()
    @

  $commit: ->
    for key of @
      continue if key.indexOf('$') is 0
      continue if key is 'constructor'
      @$model.set key, @[key]
    do @$apply # run this in case the model has changed based of the committed values
  $json: ->
    out = {}
    for key of @
      continue if key.indexOf('$') is 0
      continue if key is 'constructor'
      out[key] = @[key]
    out
  $save: (opts)->
    do @$commit
    @$model.save(opts).then =>
      do @$apply
  $fetch: (opts)->
    do @$commit
    @$model.fetch(opts).then =>
      do @$apply
    , ->
      console.info 'Facade fetch failed'
  $delete: ->
    do @$model.remove
  $reset: ->
    do @$model.reset
    do @$apply


(exports ? this).ConveyorFacade = ConveyorFacade
