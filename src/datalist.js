'use strict'

/**
 * @mixin datalist
 * A mixin that maintains a small and simple dataset.
 * This is typically used as a foundaiton for list components.
 * @fires create
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
  datalist: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: function () {
      var me = this

      chassis.core.spliceArgs(arguments).forEach(function (element) {
        if (typeof element === 'string') {
          document.querySelectorAll(element).forEach(function (el) {
            me.applyDataList(el)
          })
        } else if (element instanceof HTMLElement) {
          me.applyDataList(element)
        } else {
          console.warn('Could not apply datalist to element. Element is not a valid HTMLElement or CSS selector.')
          console.log(element)
        }
      })
    }
  },

  applyDataList: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (element) {
      Object.defineProperties(element, {
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
        }
      })

      Object.defineProperties(element, {
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

        /**
         * @method add
         * Append data items to the list. This method can take any number
         * of data item arguments. It can also take a single array argument.
         *
         * **Example**
         *
         * ```js
         * mylist.add('item1', 'item2', 'more items')
         *
         * // OR
         *
         * mylist.add(['item1', 'item2', 'more items'])
         * ```
         * @param {array} [items]
         * An array of items.
         */
        add: {
          enumerable: true,
          value: function () {
            if (arguments.length === 0) {
              throw new Error('addData requires at least one argument.')
            }

            var args = chassis.core.spliceArgs(arguments)

            if (this.deduplicate) {
              args = chassis.core.deduplicate(args)
            }

            var me = this
            var newItems = args.filter(function (item) {
              return me.listData.indexOf(item) < 0
            })

            this.listData = this.listData.concat(args)

            chassis.core.emit(this, 'create', {data: newItems})
            chassis.core.emit(this, 'update', {
              created: newItems,
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

            chassis.core.emit(this, 'delete', {data: removed})
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

            chassis.core.emit(this, 'modify', {
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
        },

        /**
         * @method indexOf
         * Identifies the first index of a value within the list.
         * @param {any} value
         * The value to return from the list.
         * @return {number}
         * Returns the index of the value within the data set.
         * Returns `-1` if the value is not found.
         */
        indexOf: {
          enumerable: true,
          writable: false,
          configurable: false,
          value: function (value) {
            var index = -1
            for (var x = 0; x < this.listData.length; x++) {
              if (this.listData[x] === value) {
                index = x
                break
              }
            }
            return index
          }
        }
      })
    }
  }
})
