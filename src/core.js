window.chassis = {}

/**
 * @class chassis
 * The root library.
 * @singleton
 */
Object.defineProperties(window.chassis, {
  /**
   * @method apply
   * Apply a mixin to a DOM element/s.
   * ```js
   * var myInputField = document.getElementById('myinput')
   *
   * // Apply to a single element
   * chassis.apply('listinput', myInputField)
   *
   * // Alternative syntax
   * chassis.listinput(myInputField)
   *
   * // Apply to multiple elements at once:
   * chassis.listinput('css > selector > input')
   * chassis.listinput([HTMLInputElementA, HTMLInputElementB])
   ```
   */
  apply: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: function () {
      var args = this.core.spliceArgs(arguments)
      var mixin = args.shift()

      this[mixin](args)
    }
  }
})

/**
 * @class chassis.core
 * Core functionality used throughout the library.
 * @private
 * @singleton
 */
Object.defineProperty(window.chassis, 'core', {
  enumerable: false,
  writable: false,
  configurable: false,
  value: {
    /**
     * @method getObjectPrototype
     * A polyfill to support older browsers (IE11)
     * @param {object|function} obj
     * The object to return the prototype of.
     * @private
     */
    getObjectPrototype: function (obj) {
      if (Object.hasOwnProperty('getPrototypeOf')) {
        return Object.getPrototypeOf(obj)
      } else if (obj.hasOwnProperty('__proto__')) { // eslint-disable-line no-proto
        return obj.__proto__ // eslint-disable-line no-proto
      } else if (obj.hasOwnProperty('prototype')) {
        return obj.prototype
      }

      return obj
    },

    /**
     * @method deduplicate
     * Deduplicate an array.
     * @param  {array} array
     * The array to deduplicate
     * @return {array}
     */
    deduplicate: function (array) {
      return array.filter(function (element, index, a) {
        return a.indexOf(element) === index
      })
    },

    /**
     * @method spliceArguments
     * A method to convert function arguments to an array.
     * This method also looks at each argument to determine
     * whether it is an array or not. Any array element is
     * automatically flattened/concatenated into the results.
     * @param  {arguments} argumentObject
     * The argument object(s).
     * @return {array}
     */
    spliceArgs: function (argumentObject) {
      var args = []
      var baseArgs = Array.prototype.slice.call(argumentObject)

      baseArgs.forEach(function (arg) {
        if (arg instanceof Array) {
          args = args.concat(arg)
        } else {
          args.push(arg)
        }
      })

      return args
    },

    /**
     * @method emit
     * A shortcut method for emitting a CustomEvent.
     * @param {HTMLElement} element
     * The element from which the event is triggered.
     * @param {string} eventName
     * The name of the event.
     * @param {object} [payload]
     * An optional payload. This is applied to the event's `detail` attribute.
     */
    emit: function (element, eventName, payload) {
      var event
      try {
        if (payload) {
          event = new CustomEvent(eventName, {
            detail: payload
          })
        } else {
          event = new CustomEvent(eventName)
        }
      } catch (e) {
        console.log(e)
        event = document.createEvent('Event')
        if (payload) {
          event.initCustomEvent(eventName, true, true, {
            detail: payload
          })
        } else {
          event.initEvent(eventName, true, true)
        }
      }

      element.dispatchEvent(event)
    },

    /**
     * @method createChildDomMonitor
     * Creates a MutationObserver that only listens for addition/removal of
     * child DOM elements. This method does not account for attribute modifications
     * to an element. The observer is triggered immediately.
     * @param {HTMLElement} monitoredElement
     * The element to watch.
     * @param {function} callback
     * The callback is fired for every childlist mutation observed. The callback
     * receives two arguments: `element` and `mutation`. The element is a reference
     * to the monitoredElement. The mutation is the raw mutation object provided
     * by the observer.
     * @param {boolean} [subtree=false]
     * Monitor the children of the monitoredElement's children.
     * @return {MutationObserver}
     * The actual mutation observer is returned by this method.
     * @private
     */
    createChildDomMonitor: function (monitoredElement, callback, subtree) {
      var monitor = new MutationObserver(function (mutations) {
        for (var m in mutations) {
          if (mutations[m].type === 'childList') {
            callback(monitoredElement, mutations[m])
          }
        }
      })

      monitor.observe(monitoredElement, {
        childList: true,
        attributes: false,
        characterData: false,
        subtree: typeof subtree === 'boolean' ? subtree : false
      })

      return monitor
    }
  }
})
