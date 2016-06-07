class ConveyorValueCore
  @transformers = []
  $init:null
  immutable:false
  forced:false
  nullable:true
  empty_value:null
  constructor: (raw, @key, @model, @conf,force=true)->
    if @conf.immutable
      @immutable = true
    if @conf.nullable?
      @nullable = @conf.nullable
    if @conf.empty_value isnt undefined
      @empty_value = @conf.empty_value
    @current = null
    @dirty = false
    @saved = false
    @errors = []
    @history = []
    @$apply(raw, force).then =>
      if typeof @$init is 'function'
        @$init()
  get: -> @current

  set: (value,force=false)->
    @$apply value,force
  reset: ->
    if @dirty and @history.length > 1 and @forced
      @$apply @history[0], true
    else
      @$apply null, true

  undo: ->
    if @dirty and @history.length > 1
      @$apply @history[@history.length - 1], true


  @onApply: (fn)->
    tr = Conveyor.Transformer fn
    if @transformers.length
      @transformers.push tr
    else
      @transformers = [tr]

  @onPublish: (fn)->
    tr = Conveyor.Transformer null, fn
    if @transformers.length
      @transformers.push tr
    else
      @transformers = [tr]

  $diff: (a,b)->
    return a isnt b

  $apply: (value, force=false)->
    if @immutable and not force and @history.length
      return ConveyorPromise.reject()
    if force
      @forced = true
    if value is null
      if not @nullable and @empty_value isnt null
        value = @empty_value
      else if not @nullable
        throw "#{@key} cannot be set to null"
    @raw = value
    original = @current
    cb = (value)=>
      if value instanceof ConveyorValueCore
        @current = value.raw
      else
        @current = value
      if !force && @$diff @current, original
        @dirty = true
        @history.push original
        @model.$trigger "change:#{@key}", @
        # console.info 'triggered',"change:#{@key}",original,@current
      if force
        @dirty = false
        @history = []
        @model.$trigger "change:#{@key}", @
        # console.info 'triggered',"change:#{@key}"
      @
    if value is null
      ConveyorPromise.resolve cb null
    else
      ConveyorBelt.run(@, @constructor.transformers,'apply').then cb
      , (err)->
        @exception err

  $publish: ()->
    # console.info '$publish',@current
    out = null;
    ConveyorBelt.run(@, @constructor.transformers,'publish').then (value)->
      if value instanceof ConveyorValueCore
        out = value.current
      else
        out = value
    , (err)->
      @exception err
    return out
  exception: (message)->
    console.error message
    throw new ConveyorModelValueException message, @

ConveyorValue = {}
class ConveyorValue.String extends ConveyorValueCore
  empty_value:''
  @onApply (value)->
    if typeof value.raw is 'string'
      return @next value.raw
    if not value.raw
      return @next ''
    if typeof value.raw is 'boolean'
      return @next value.raw && (value.conf.boolTrue || '1') || (value.conf.boolFalse || '0')
    if value.raw.toString?
      return @next value.raw.toString()
    value.exception("ConveyorValue.String - Cannot convert value to string.")

class ConveyorValue.Number extends ConveyorValueCore
  empty_value:0
  @onApply (value)->
    if typeof value.raw is 'boolean'
      return @next value.raw && 1 || 0
    if typeof value.raw is 'string'
      if value.raw.length is 0
        return @next 0
      if value.raw.match(/[^0-9$%#,.\s\r\n]/g)
        value.exception "Cannot convert `#{value.raw}` to a number."
      return @next parseFloat value.raw.replace(/[^0-9\.]/g, '')
    if value.raw instanceof Number or typeof value.raw is 'number'
      return @next value.raw
    value.exception "Cannot convert `#{value.raw}` to a number."
  
class ConveyorValue.Currency extends ConveyorValueCore
  empty_value:0
  @onApply (value)->
    if typeof value.raw is 'string'
      if value.raw.length is 0
        return @next 0
      if value.raw.match(/[^0-9$%#,.\s\r\n]/g)
        value.exception "Cannot convert `#{value.raw}` to a number."
      return @next parseFloat value.raw.replace(/[^0-9\.]/g, '')
    if value.raw instanceof Number or typeof value.raw is 'number'
      return @next value.raw
    value.exception "Cannot convert `#{value.raw}` to a number."
  

class ConveyorValue.Boolean extends ConveyorValueCore
  empty_value:false
  @onApply (value)->
    if typeof value.raw is 'boolean'
      return @next value.raw
    if typeof value.raw is 'string'
      if ['yes','true','1'].indexOf(value.raw) isnt -1
        return @next true
      if ['no','false','0'].indexOf(value.raw) isnt -1
        return @next false
    if typeof value.raw is 'number'
      return @next value.raw isnt 0 && true || false
    value.exception "Cannot convert `#{value.raw}` to a boolean."

class ConveyorValue.Raw extends ConveyorValueCore

class ConveyorValue.Model extends ConveyorValueCore
  immutable: true
  $init: ->
    if @conf.on
      @model.$on "change:#{@conf.on}", (value)=>
        # console.log "run change:#{@conf.on}"
        @$apply value.get(), true
  @onApply (value,pipe)->
    if value.conf.on
      ref = value.model.get value.conf.on
    if typeof value.raw is 'object'
      nm = value.conf.model.sync value.raw
      if value.conf.on and not ref
        value.model.set value.conf.on, nm.getPrimaryKey()
      return @next nm
    if typeof value.raw is 'number'
      if value.current instanceof ConveyorModel
        if value.current.getPrimaryKey() isnt value.raw
          value.conf.model.get(value.raw).then (model)=>
            console.warn model
            @next model
          , (err)->
            throw err
          return
        else
          return @next value.current
      else
        value.conf.model.get(value.raw).then (model)=>
          @next model
        , (err)->
          throw err
        return
        # return @next new value.conf.model value.raw
    @next value.raw
  @onPublish (value)->
    if value.current instanceof ConveyorModel
      return @next value.current.getPrimaryKey()
    @next value.current

class ConveyorModelValueException
  constructor: (@message,@value)->


root = exports ? window
root.ConveyorValueCore = ConveyorValueCore
root.ConveyorValue = ConveyorValue