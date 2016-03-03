class ConveyorHttpInterface extends ConveyorInterface
  constructor: (options)->
    @$$setDefaults
      endpoint: null
      endpointExt: null
      actions: []
      transformers: []
      listTransformers: []
    , options
  fetch: ()->
    # 
  remove: (data, conf)->
    promise = new ConveyorPromise
    params = ConveyorUtil.extend {}, data, conf.params
    path = @$$path('remove')(params)
    @$$req('delete', path).then (data)=>
      promise.resolve data
    , (xhr,status,err)->
      promise.reject err
    promise

  list: (conf)->
    # console.info 'list',conf
    conf = ConveyorUtil.obj conf
    promise = new ConveyorPromise
    path = @$$path('list')(ConveyorUtil.obj conf.params)
    @$$req('get', path, ConveyorUtil.obj(conf.data), conf.queue || null).then (data)=>
      # console.log 'http got',data
      ConveyorBelt.run(data, @listTransformers,'apply').then (value)=>
        # console.log 'conveyor belt got',data
        if value not instanceof Array
          throw "list must be array"
        else
          ConveyorBelt.thread(data, @transformers,'apply').then promise
      , promise.reject
    , (xhr,status,err)->
      promise.reject err
    promise

  save: (data, conf)->
    promise = new ConveyorPromise
    ConveyorBelt.run(data, @transformers,'publish',conf).then (data)=>
      params = ConveyorUtil.extend {}, data, conf.params
      path = @$$path('save', conf.custom_path && conf.custom_path || false)(params)
      @$$req('put', path, data).then (data)=>
        ConveyorBelt.run(data, @transformers,'apply').then promise
      , (xhr,status,err)->
        promise.reject err
    , (err)->
      promise.reject err
    promise

  create: (data, conf)->
    promise = new ConveyorPromise
    ConveyorBelt.run(data, @transformers,'publish').then (data)=>
      params = ConveyorUtil.extend {}, data, conf.params
      path = @$$path('create')(params)
      @$$req('post', path, data).then (data)=>
        ConveyorBelt.run(data, @transformers,'apply').then promise
      , (xhr,status,err)->
        promise.reject err
    , (err)->
      promise.reject err
    promise

  $$path: (method, custom_path)->
    out = ''

    if custom_path and custom_path.indexOf('./') isnt 0
      return @$$interpolate custom_path
    if typeof @endpoint is 'object'
      if @endpoint[method]?
        out = @endpoint[method] 
      else if ['remove','save'].indexOf(@endpoint[method]) isnt -1 and @endpoint['fetch']?
        out = @endpoint['fetch']
      else if method is 'create' and @endpoint['list']?
        out = @endpoint['list']
      else
        throw "No valid endpoint for #{method}."
    else if typeof @endpoint is 'string'
      if ['list','create'].indexOf(method) isnt -1
        out = @endpoint
      else
        out = @endpoint+'/{id}'
    else
      throw "No valid endpoint for #{method}."

    if custom_path and custom_path.indexOf('./') is 0
      out += custom_path.substr 1
    if @endpointExt? and typeof @endpointExt is 'string'
      out += @endpointExt

    @$$interpolate out

  queue_index: 0
  queues: {}
  $$req: (method,path,args, queue)->
    req = $.ajax
      url: path
      method: method
      data: method isnt 'get' && JSON.stringify(args) || args
      contentType: 'application/json'
      dataType: 'json'

    console.info 'req',method,path,args,queue
    if queue? and typeof queue is 'object'
      # console.info 'queue is object',queue,typeof queue
      if not @queues[queue.id]?
        @queues[queue.id] = length: 0
      if queue.abort
        for x of @queues[queue.id]
          continue if x is 'length'
          console.error 'aborting',@queues[queue.id],x,queue.id
          do @queues[queue.id][x].abort
        # @queues[queue.id] = length: 0
      ti = @queue_index++
      @queues[queue.id][ti] = req
      console.info 'starting',@queues[queue.id][ti],ti,queue.id
      @queues[queue.id].length++
      req.always =>
        console.warn 'completing',@queues[queue.id][ti],ti,queue.id
        if @queues[queue.id][ti]?
          @queues[queue.id].length--
          delete @queues[queue.id][ti]
    req





(exports ? this).ConveyorHttpInterface = ConveyorHttpInterface