'use strict'

/**
 * @mixin listinput
 * A mixin that manages a list of input data.
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
      chassis.datalist(element)

      Object.defineProperties(element, {
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

      element.addEventListener('keyup', function (e) {
        if (e.code === 'Enter') {
          element.submit()
        }
      })

      Object.defineProperties(element, {
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
          value: function (callback) {
            var inputData = this.splitInput(this.inputField.value)

            if (inputData.length === 0) {
              this.inputField.value = ''
              return
            }

            if (this.deduplicateInput) {
              inputData = chassis.core.deduplicate(inputData)
            }

            this.inputField.value = ''

            if (inputData.length === 0) {
              return
            }

            chassis.core.emit(this, 'submit', inputData)
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
        }
      })
    }
  }
})
