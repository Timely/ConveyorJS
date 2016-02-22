class ConveyorValueCore
  @transformers = []
  constructor: (raw, @model, @conf)->
    @current = null
    @dirty = false
    @saved = false
    @errors = []
    @history = []
    @$apply raw, true
  get: -> @current

  set: (value)->
    @$apply value

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


  $apply: (value, force=false)->
    @raw = value
    original = @current
    # console.info '$apply',value,@constructor.transformers
    ConveyorBelt.run(@, @constructor.transformers,'apply').then (value)=>
      if value instanceof ConveyorValueCore
        @current = value.raw
      else
        @current = value
      if !force && @current isnt original
        @dirty = true
      if force
        @dirty = false
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
  @onApply (value)->
    if typeof value.raw is 'boolean'
      return @next value.raw && 1 || 0
    if typeof value.raw is 'string'
      if value.raw.length is 0
        return @next 0
      if value.raw.match(/[^0-9$%#,.\s\r\n]/g)
        value.raw.exception "Cannot convert `#{value.raw}` to a number."
      return @next parseFloat value.raw.replace(/[^0-9\.]/g, '')
    if value.raw instanceof Number or typeof value.raw is 'number'
      return @next value.raw
    value.exception "Cannot convert `#{value.raw}` to a number."
  

class ConveyorValue.Boolean extends ConveyorValueCore
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

class ConveyorValue.Model extends ConveyorValueCore
  @onApply (value)->
    if typeof value.raw is 'object'
      return @next new value.conf.model value.raw
    @next value.raw

class ConveyorModelValueException
  constructor: (@message,@value)->


root = exports ? window
root.ConveyorValueCore = ConveyorValueCore
root.ConveyorValue = ConveyorValue