class ConveyorUtil
  _arrayForEach: (a,cb)->
    if not Array.isArray a
      throw "_arrayForEach expects an array, given: #{typeof a}"
    a.length
  @makePromise: (obj)->
    obj::__pr_util = ->
      if not @_resolvers?
        @_resolvers = []
      if not @_rejecters?
        @_rejecters = []
    obj::resolve = ->
      @__pr_util()
      for fn in @_resolvers
        fn.apply @, arguments
    obj::reject = ->
      @__pr_util()
      for fn in @_rejecters
        fn.apply @, arguments
    obj::then = (success, fail)->
      @__pr_util()
      if success
        @_resolvers.push success
      if fail
        @_rejecters.push fail
      return @
    obj::catch = (fail)->
      @__pr_util()
      if fail
        @_rejecters.push fail
      return @

class ConveyorBase extends ConveyorUtil
  _setDefaults: (base, opts)->
    if typeof opts is 'object'
      for x of opts
        base[x] = opts[x];
    for x of base
      @[x] = base[x];

(exports ? this).ConveyorBase = ConveyorBase
(exports ? this).ConveyorUtil = ConveyorUtil