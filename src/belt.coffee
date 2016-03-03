class ConveyorBelt
  constructor: (data,transformers,direction,conf)->
    @promise = new ConveyorPromise
    @data = data
    @extra = ConveyorUtil.obj conf
    tmp = transformers instanceof Array && transformers || [transformers]
    @direction = direction || 'apply'
    # resort array without affecting the original array
    if @direction is 'publish'
      rtmp = []
      for i in tmp by -1
        rtmp.push i
      tmp = rtmp
      
    @transformers = tmp
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
      @transformers[@pos]["$#{@direction}"] @data, @
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

  @run: (d,t,dd,conf)->
    (new ConveyorBelt d,t,dd,conf).promise
  @thread: (arr,t,dd)->
    promises = []
    for d in arr
      promises.push (new ConveyorBelt d,t,dd).promise
    ConveyorPromise.aggregate(promises)


(exports ? this).ConveyorBelt = ConveyorBelt
