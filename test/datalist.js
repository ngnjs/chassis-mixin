'use strict'

var test = require('tape')
var element = document.createElement('input')
element.setAttribute('separator', ';')
element.setAttribute('deduplicate', 'true')
element.setAttribute('deduplicateInput', 'true')
element.classList.add('chassis-listinput')

test('datalist Sanity Checks', function (t) {
  t.ok(chassis.applyDataList !== undefined, 'chassis.applyDataList exists.')
  t.ok(chassis.datalist !== undefined, 'chassis.datalist exists.')
  t.end()
})

test('datalist attributes', function (t) {
  chassis.datalist(element)

  t.ok(element.separator === ';', 'separator attribute recognized.')
  t.ok(element.deduplicate === true, 'deduplicate attribute recognized.')
  t.end()
})

test('datalist data creation', function (t) {
  var updateEventFired = false

  var updateListener = function (e) {
    t.pass('update event fired.')
    t.ok(e.detail.created.length === 3, 'Proper array emitted in "create" event.')
    t.ok(e.detail.created.join('-') === 'testA-testB-testC', 'Proper data emitted in "create" event.')
    updateEventFired = true
    element.removeEventListener('update', updateListener)
  }

  element.addEventListener('update', updateListener)

  element.addEventListener('create', function (e) {
    t.pass('create event fired.')
    t.ok(e.detail.data.length === 3, 'Proper array emitted in "create" event.')
    t.ok(e.detail.data.join('-') === 'testA-testB-testC', 'Proper data emitted in "create" event.')
    var monitor = setInterval(function () {
      if (updateEventFired) {
        clearInterval(monitor)
        t.end()
      }
    }, 100)
  })

  element.add('testA', 'testB', 'testC')
})

test('datalist index retrieval', function (t) {
  t.ok(element.indexOf('testB') === 1, 'indexOf returns proper index for a given list item value.')
  t.end()
})

test('datalist data removal', function (t) {
  var deleteListener = function (e) {
    element.removeEventListener('delete', deleteListener)
    t.pass('delete event fired.')
    t.ok(e.detail.data.length === 1, 'Removed the proper number of items.')
    t.ok(e.detail.data[0] === 'testA', 'Removed item returned successfully in event payload.')
    t.end()
  }

  element.addEventListener('delete', deleteListener)

  element.remove(0)
  t.ok(element.data[0] === 'testB', 'Removing an element works.')
})

test('datalist data modification', function (t) {
  var updateListener = function (e) {
    element.removeEventListener('modify', updateListener)
    t.pass('modify event fired.')
    t.ok(e.detail.index === 0, 'Modified the proper item.')
    t.ok(e.detail.old === 'testB', 'Old value delivered in event payload.')
    t.ok(e.detail.new === 'testX', 'New value delivered in event payload.')
    t.end()
  }

  element.addEventListener('modify', updateListener)

  element.setItem(0, 'testX')
  t.ok(element.data[0] === 'testX', 'Modify an item.')
})

test('datalist clearing', function (t) {
  element.clear()
  t.ok(element.data.length === 0, 'Datalist cleared.')
  t.end()
})
