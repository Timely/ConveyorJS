class ConveyorUtil
  @extend: (base, ext...)->
    base = @obj base
    for obj in ext
      if typeof obj is 'object'
        for x of obj
          base[x] = obj[x];
    return base
  @obj: (val, def)->
    if typeof val is 'object'
      return val
    if typeof def is 'object'
      return def
    return {}
  @escapeRegex = (s) ->
    String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace /\x08/g, '\\x08'
  $$arrayForEach: (a,cb)->
    if not Array.isArray a
      throw "$arrayForEach expects an array, given: #{typeof a}"
    a.length
  $on: (ev, handler)->
    if not @__eventHandlers?
      @__eventHandlers = {}
    if not @__eventHandlers[ev]?
      @__eventHandlers[ev] = []
    @__eventHandlers[ev].push handler

  $trigger: (ev, args...)->
    # console.log 'trying event',ev,@__eventHandlers
    if not @__eventHandlers?
      return
    if not @__eventHandlers[ev]?
      return
    for x in @__eventHandlers[ev]
      console.log 'forwarding event',ev
      if typeof x is 'function'
        x.apply @, args

  # inspired by https://gist.github.com/padolsey/6008842
  $$interpolate: do ->
    rc = 
      '\n': '\\n'
      '"': '\"'
      '\u2028': '\\u2028'
      '\u2029': '\\u2029'
    (str) ->
      new Function('o', 'return "' + str.replace(/["\n\r\u2028\u2029]/g, ($0) ->
        rc[$0]
      ).replace(/\{([\s\S]+?)\}/g, '" + o["$1"] + "') + '";')

class ConveyorBase extends ConveyorUtil
  $$apply: (fn,args)->
    @[fn].apply @, args
  $$call: (fn,args...)->
    @[fn].apply @, args
  $$setDefaults: (base, opts)->
    if typeof opts is 'object'
      for x of opts
        base[x] = opts[x];
    for x of base
      @[x] = base[x];

(exports ? this).ConveyorBase = ConveyorBase
(exports ? this).ConveyorUtil = ConveyorUtil