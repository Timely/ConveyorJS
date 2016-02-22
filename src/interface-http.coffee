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
  remove: ()->
  list: (conf)->
    # console.info 'list',conf
    conf = ConveyorUtil.obj conf
    promise = new ConveyorPromise
    path = @$$path('list')(ConveyorUtil.obj conf.params)
    @$$req('get', path, ConveyorUtil.obj conf.data).then (data)=>
      ConveyorBelt.run(data, @listTransformers,'apply').then (value)=>
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
    ConveyorBelt.run(data, @listTransformers,'publish').then (data)=>
      params = ConveyorUtil.extend {}, data, conf.params
      path = @$$path('save')(params)
      console.info data
      @$$req('put', path, data).then (data)=>
        console.info 'saved',data
        ConveyorBelt.run(data, @transformers,'apply').then promise
      , (xhr,status,err)->
        promise.reject err
    , (err)->
      promise.reject err
    promise

  create: (data, conf)->
    promise = new ConveyorPromise
    ConveyorBelt.run(data, @listTransformers,'publish').then (data)=>
      params = ConveyorUtil.extend {}, data, conf.params
      path = @$$path('create')(params)
      console.info 'creating with', data
      @$$req('post', path, data).then (data)=>
        ConveyorBelt.run(data, @transformers,'apply').then promise
      , (xhr,status,err)->
        promise.reject err
    , (err)->
      promise.reject err
    promise

  $$path: (method)->
    out = ''
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

    if @endpointExt? and typeof @endpointExt is 'string'
      out += @endpointExt

    @$$interpolate out


  $$req: (method,path,args)->
    $.ajax
      url: path
      method: method
      data: method isnt 'get' && JSON.stringify(args) || args
      contentType: 'application/json'
      dataType: 'json'


(exports ? this).ConveyorHttpInterface = ConveyorHttpInterface