'use strict'

var test = require('tape')
var element = document.createElement('input')
element.setAttribute('separator', ';')
element.setAttribute('deduplicate', 'true')
element.setAttribute('deduplicateInput', 'true')
element.classList.add('chassis-listinput')

test('listinput Sanity Checks', function (t) {
  t.ok(chassis.applyListInput !== undefined, 'chassis.applyListInput exists.')
  t.ok(chassis.listinput !== undefined, 'chassis.listinput exists.')
  t.end()
})

test('listinput attributes', function (t) {
  chassis.listinput(element)

  t.ok(element.separator === ';', 'separator attribute recognized.')
  t.ok(element.deduplicate === true, 'deduplicate attribute recognized.')
  t.ok(element.deduplicateInput === true, 'separator attribute recognized.')
  t.end()
})

test('listinput data management', function (t) {
  element.value = 'testA;testB;testC'

  var firstHandler = function (e) {
    t.ok(e.detail.hasOwnProperty('created') &&
      e.detail.hasOwnProperty('deleted') &&
      e.detail.hasOwnProperty('modified'), 'Proper attributes emitted on update.')
  }

  var appendHandler = function (e) {
    t.ok(e.detail.data.length === 3 &&
      e.detail.data[0] === 'testA' &&
      e.detail.data[1] === 'testB' &&
      e.detail.data[2] === 'testC', 'Proper data emitted in "append" event.')
    t.ok(element.data.length === 3, 'Successfully added data to the list.')

    element.removeEventListener('append', appendHandler)
    element.removeEventListener('update', firstHandler)

    element.append('test4')
    t.ok(element.data[3] === 'test4', 'append() works independently of submit()')

    element.remove(0)
    t.ok(element.data[0] === 'testB', 'Removing an element works.')

    element.addEventListener('modified', modifyHandler)
    element.setItem(0, 'x')
  }

  var modifyHandler = function (e) {
    t.ok(e.detail.old === 'testB' &&
      e.detail.new === 'x' &&
      e.detail.index === 0, 'Modification triggers a change event.')

    element.removeEventListener('modified', modifyHandler)

    element.addEventListener('remove', function (e) {
      t.ok(e.detail.data.length > 0, 'Removal triggers a properly defined event payload.')
      t.ok(element.data.length === 0, 'Clear removes all data.')
      t.end()
    })

    element.clear()
    t.ok(element.data.length === 0, 'clear() works.')
  }

  element.addEventListener('append', appendHandler)
  element.addEventListener('update', firstHandler)
  element.submit()
})
