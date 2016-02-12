class ConveyorHttpInterface extends ConveyorInterface
  constructor: (options)->
    @_setDefaults
      endpoint: null
      actions: []
      transformers: []
      listTransformers: []
    , options
  fetch: ()->
    # 
  remove: ()->
  list: (args)->
    promise = new ConveyorPromise
    path = @endpoint
    @_req('get', path, args).then (data)=>
      ConveyorBelt.run(data, @listTransformers,'apply').then (value)=>
        if value not instanceof Array
          throw "list must be array"
        else
          ConveyorBelt.thread(data, @transformers,'apply').then promise
      , promise.reject
    , (xhr,status,err)->
      promise.reject err
    promise

  save: (data)->

  _buildPath: ->

  _req: (method,path,args)->
    $.ajax
      url: path
      method: method
      data: args


(exports ? this).ConveyorHttpInterface = ConveyorHttpInterface