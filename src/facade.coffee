class ConveyorFacade
  $$transformer: null
  constructor: (@$model, transformer)->
    @$$transformer = Conveyor.getTransformer transformer
    @$$apply()
  $$apply: ->
    for key of @$model.data
      @[key] = @$model.get key
      if @[key] instanceof ConveyorModel
        @[key] = new ConveyorFacade @[key]
    if @$$transformer
      ConveyorBelt.run @, @$$transformer, 'apply'
    @

  $commit: ->
    for key of @
      continue if key.indexOf('$') is 0
      @$model.set key, @[key]
  $save: (opts)->
    @$commit()
    @$model.save(opts).then =>
      @$$apply()
  $delete: ->
    @$model.remove()
    # apply changes made to object to model


(exports ? this).ConveyorFacade = ConveyorFacade