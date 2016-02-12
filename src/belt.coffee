class ConveyorBelt
  constructor: (data,transformers,direction)->
    @promise = new ConveyorPromise
    @data = data
    @transformers = transformers
    @direction = direction || 'apply'
    @pos = -1
    @status = -1
    @error = false
    @warnings = []
    @next(@data)
  next: (data)->
    @data = data
    @pos++
    @status = 0
    if @pos < @transformers.length
      @transformers[@pos]["$#{@direction}"] @data, this
    else
      @status = 1
      @promise.resolve data
    @
  reject: (err)->
    @promise.reject err
  skip: ->
    @next @data
  warn: (warning)->
    @warnings.push warning
  later: (executor)->
  inject: (transformer)->
    @transformers.splice @pos+1,0,transformer
    @
  append: (transformer)->
    @transformers.push transformer
    @

  @run: (d,t,dd)->
    (new ConveyorBelt d,t,dd).promise
  @thread: (arr,t,dd)->
    promises = []
    for d in arr
      promises.push (new ConveyorBelt d,t,dd).promise
    ConveyorPromise.aggregate(promises)


(exports ? this).ConveyorBelt = ConveyorBelt
