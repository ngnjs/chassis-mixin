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
  element.value = 'testA;testB;testC;testC'

  element.addEventListener('submit', function (e) {
    t.pass('submit event fired.')
    console.log(element.value)
    t.ok(element.value.trim().length === 0, 'Form element cleared after submit.')
    t.ok(e.detail.length === 3, 'Values deduplicated and delivered in submit event payload.')
    t.end()
  })

  element.submit()
})
