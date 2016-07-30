'use strict'

/**
 * @component chassis-listinput
 * A component that maintains a small dataset of it's elements.
 * @fires append
 * A payload is sent with the data that was added to the list.
 *
 * **Example**
 *
 * ```js
 * {
 *   detail: {
 *   	 data: ['item1', 'item2']
 *   }
 * }
 * ```
 * @fires update
 * Triggered whenever the list is modified. The modifications are
 * delivered to event handlers.
 *
 * ```js
 * {
 *   detail: {
 *     created: ['item1', 'item2'], // The values added to the list.
 *     deleted: ['item1', 'item2'], // The values removed from the list.
 *     modified: [                  // The modified values.
 *     	 {old: 'item1', new: 'item1_changed', index: 0},
 *     	 {old: 'item2', new: 'item2_changed', index: 1}
 *     ]
 *   }
 * }
 * ```
 * @fires remove
 * Triggered when data is removed from the list.
 *
 * **Example Payload**
 * ```js
 * {
 *   detail: {
 *     data: ['item1', 'item2']
 *   }
 * }
 * ```
 * @fires modify
 * Triggered when a list data item is changed.
 *
 * **Example Payload**
 * ```js
 * {
 *   detail: {
 *     index: 0, // First item in the list.
 *     old: 'oldValue',
 *     new: 'newValue' // Current value.
 *   }
 * }
 * ```
 */
Object.defineProperties(window.chassis, {
  listinput: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: function () {
      var me = this
      chassis.core.spliceArgs(arguments).forEach(function (element) {
        if (typeof element === 'string') {
          document.querySelectorAll(element).forEach(function (el) {
            me.applyListInput(el)
          })
        } else if (element instanceof HTMLElement) {
          me.applyListInput(element)
        } else {
          console.warn('Could not apply listinput to element. Element is not a valid HTMLElement or CSS selector.')
          console.log(element)
        }
      })
    }
  },

  applyListInput: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (element) {
      Object.defineProperties(chassis.core.getObjectPrototype(element), {
        listData: {
          enumerable: false,
          writable: true,
          configurable: false,
          value: []
        },

        /**
         * @attribute {string|regexp} [separator=,]
         * The character used to separate list items. By default, this is a comma.
         * This can also be a regular expression.
         */
        separator: {
          enumerable: false,
          writable: true,
          configurable: false,
          value: element.attributes.hasOwnProperty('separator') ? element.getAttribute('separator') : ','
        },

        /**
         * @attribute {boolean} [deduplicate=true]
         * Setting to `true` (default) assures the list data contains no duplicate
         * values. Whatever value is defined for this becomes the default for
         * #deduplicateInput.
         * @type {Object}
         */
        deduplicate: {
          enumerable: false,
          writable: true,
          configurable: false,
          value: element.attributes.hasOwnProperty('deduplicate') ? element.getAttribute('deduplicate') === 'true' : true
        },

        /**
         * @attribute {boolean} [deduplicateInput=true]
         * Ignore duplicate values in the input field.
         */
        deduplicateInput: {
          enumerable: false,
          writable: true,
          configurable: false,
          value: element.attributes.hasOwnProperty('deduplicateInput')
            ? element.getAttribute('deduplicateInput') === 'true'
            : (element.attributes.hasOwnProperty('deduplicate') ? element.getAttribute('deduplicate') === 'true' : true)
        }
      })

      if (element.attributes.hasOwnProperty('for')) {
        var list = document.querySelector('#' + element.getAttribute('for'))

        if (list === null) {
          throw new Error('The specified DOM element, ' + element.getAttribute('for') + ', could not be found or does not exist.')
        } else {
          chassis.core.createChildDomMonitor(element, function (detail) {
            chassis.core.emit(element, 'domchange', detail)
          })
        }
      }

      element.addEventListener('keyup', function (e) {
        if (e.code === 'Enter') {
          element.submit()
        }
      })

      Object.defineProperties(chassis.core.getObjectPrototype(element), {
        /**
         * @property {array} data
         * The list data.
         * @readonly
         */
        data: {
          enumerable: true,
          get: function () {
            return this.listData
          }
        },

        // This is a placeholder. When this is converted
        // to a web component, the filesource will be within
        // the shadow root.
        filesource: {
          enumerable: true,
          get: function () {
            // this.shadowRoot.lastChild
            return element
          }
        },

        /**
         * @property inputField
         * A reference to the input field.
         * @private
         */
        inputField: {
          enumerable: true,
          get: function () {
            return element
          }
        },

        /**
         * @method browse
         * Browse for files.
         */
        browse: {
          value: function () {
            if (this.getAttribute('type') === 'file') {
              this.filesource.click()
            }
          }
        },

        /**
         * @method submit
         * This method applies any data in the input field to the
         * list. Depending on how the component is configured, it
         * will deduplicate data.
         */
        submit: {
          enumerable: false,
          value: function () {
            var inputData = this.splitInput(this.inputField.value)

            if (inputData.length === 0) {
              this.inputField.value = ''
              return
            }

            if (this.deduplicate) {
              inputData = chassis.core.deduplicate(inputData)
            }

            this.inputField.value = ''

            if (inputData.length === 0) {
              return
            }

            this.append(inputData)
          }
        },

        /**
         * @method splitInput
         * Separates the input data into an array, optionally applying
         * deduplication filters when applicable.
         * @param {string} input
         * The text data to split.
         * @private
         */
        splitInput: {
          enumerable: false,
          value: function (input) {
            var me = this

            input = input
              .replace(this.separator instanceof RegExp ? this.separator : new RegExp(this.separator + '{1,1000}', 'gi'), this.separator)
              .split(this.separator)
              .map(function (value) {
                return value.toString().trim()
              })
              .filter(function (value, i, a) {
                if (me.deduplicateInput) {
                  if (a.indexOf(value) !== i) {
                    return false
                  }
                }

                return value.toString().length > 0
              })

            return input
          }
        },

        /**
         * @method append
         * Append data items to the list. This method can take any number
         * of data item arguments. It can also take a single array argument.
         *
         * **Example**
         *
         * ```js
         * mylist.append('item1', 'item2', 'more items')
         *
         * // OR
         *
         * mylist.append(['item1', 'item2', 'more items'])
         * ```
         * @param {array} [items]
         * An array of items.
         */
        append: {
          enumerable: true,
          value: function () {
            if (arguments.length === 0) {
              throw new Error('addData requires at least one argument.')
            }

            var args = chassis.core.spliceArgs(arguments)

            if (this.deduplicate) {
              args = chassis.core.deduplicate(args)
            }

            this.listData = this.listData.concat(args)

            if (this.deduplicate) {
              this.listData = chassis.core.deduplicate(this.listData)
            }

            chassis.core.emit(this, 'append', {data: args})
            chassis.core.emit(this, 'update', {
              created: args,
              deleted: [],
              modified: []
            })
          }
        },

        /**
         * @method remove
         * Remove the item at a specified index or indexes. Pass `-1` or `null`
         * to remove everything.
         *
         * **Example**
         *
         * ```js
         * mylist.remove(null) // Removes everything (same as clear())
         * mylist.remove(-1) // Removes everything (same as clear())
         * mylist.remove(0) // Removes the first list item.
         * mylist.remove(0, 3) // Remove the first and fourth list items.
         * ```
         * @param {number[]} index
         */
        remove: {
          enumerable: true,
          value: function () {
            if (arguments.length === 0) {
              return this.clear()
            } else if (arguments[0] === null || arguments[0] === -1) {
              return this.clear()
            }

            var args = chassis.core.spliceArgs(arguments)
            var removed = []

            this.listData = this.listData.filter(function (data, index) {
              if (args.indexOf(index) < 0) {
                return true
              }

              removed.push(data)
              return false
            })

            chassis.core.emit(this, 'remove', {data: removed})
            chassis.core.emit(this, 'update', {
              created: [],
              deleted: removed,
              modified: []
            })
          }
        },

        /**
         * @method clear
         * Removes all items from the data list.
         */
        clear: {
          enumerable: true,
          value: function () {
            var originalData = this.listData

            this.listData = []

            chassis.core.emit(this, 'remove', {data: originalData})
            chassis.core.emit(this, 'update', {
              created: [],
              deleted: originalData,
              modified: []
            })
          }
        },

        /**
         * @method setItem
         * Modify a specific data list value at a given index.
         * @param {number} index
         * The index of the item within the list (0-based indexing).
         */
        setItem: {
          enumerable: true,
          value: function (index, value) {
            if (index >= this.listData.length || index < 0) {
              throw new Error('Index out of bounds. Must be between 0 and the size of the list (current max value: ' + (this.listData.length === 0 ? 0 : (this.listData.length - 1)) + ')')
            }

            var oldValue = this.listData[index]
            this.listData[index] = value

            chassis.core.emit(this, 'modified', {
              index: index,
              old: oldValue,
              new: this.listData[index]
            })

            chassis.core.emit(this, 'update', {
              created: [],
              deleted: [],
              modified: [{old: oldValue, new: this.listData[index], index: index}]
            })
          }
        }
      })
    }
  }
})
