class ConveyorPromise
  @index = 0
  constructor: (executor,delay)->
    @_ref = @constructor.index++
    if typeof executor is 'function'
      @executor = executor
    else
      @executor = null
    @resolvers = []
    @rejecters = []
    @next = null
    @status = 0
    @value = null
    if not delay && typeof executor is 'function'
      @run()
  then: (success, fail)->
    if success instanceof ConveyorPromise
      temp = success
      fail = (err)->
        temp.reject err
      success = (value)->
        temp.resolve value

    if @status is 0
      promise = new ConveyorPromise
      if success
        success.$promise = promise
        @resolvers.push success
      if fail
        fail.$promise = promise
        @rejecters.push fail
      return promise
    if @status is 1 && success
      return @_next success.call @, @value
    if @status is -1 && fail
      return @_next fail.call @, @value
    return @
  catch: (fail)->
    if @status is -1 && fail
      fail.call @, value
    if fail
      @rejecters.push fail
    return @
  @resolve: (value)->
    promise = new ConveyorPromise
    promise.status = 1
    promise.value = value
    return promise
  @reject: (value)->
    promise = new ConveyorPromise
    promise.status = -1
    promise.value = value
    return promise
  resolve: (value)->
    if @status isnt 0
      throw "This promise is already #{@status is -1 && 'rejected' || 'resolved'}. Cannot resolve."
    @value = value
    @status = 1
    for fn in @resolvers
      r = fn.call @, value
      if fn.$promise?
        fn.$promise._forward r
    @
  reject: (value)->
    if @status isnt 0
      throw "This promise is already #{@status is -1 && 'rejected' || 'resolved'}. Cannot reject."
    @value = value
    @status = -1
    for fn in @rejecters
      r = fn.call @, value
      if fn.$promise?
        fn.$promise._forward r
    @
  run: (excecutor)->
    if typeof executor is 'function'
      @executor = executor
    if typeof @executor isnt 'function'
      throw "You can only call run on a promise if an executor is provided."
    @executor.call this, @resolve, @reject
  @aggregate: (arr,strict=false)->
    agp = new ConveyorPromise
    done = 0
    total = arr.length
    failures = []
    incr = ->
      done++
      if done is total
        complete()
    complete = ->
      out = []
      errors = []
      for promise,i in arr
        if promise.status is 1
          out.push promise.value
        else
          errors.push promise.value
      if errors.length and not out.length
        return agp.reject errors
      if errors.length and strict
        return agp.reject errors
      return agp.resolve out

    for promise,i in arr
      promise.then incr,incr
    return agp
    
  _forward: (value)->
    if value instanceof ConveyorPromise
      value.then (success)=>
        @resolve success
      , (err)->
        @reject err
    else
      # console.info 'forwarding',@,value
      @resolve value

  _next: (value)->
    # console.log '_next',value
    if value instanceof ConveyorPromise
      return value
    else
      return ConveyorPromise.resolve value


(exports ? this).ConveyorPromise = ConveyorPromise