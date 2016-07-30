'use strict'

var test = require('tape')

test('Sanity checks (Global namespace)', function (t) {
  t.ok(chassis !== undefined, 'chassis namespace exists.')
  t.ok(chassis.apply !== undefined, 'chassis.apply() exists.')
  t.ok(typeof chassis.apply === 'function', 'chassis.apply() is  valid function.')
  t.ok(chassis.core.deduplicate !== undefined, 'chassis.core.deduplicate() exists.')
  t.ok(chassis.core.spliceArgs !== undefined, 'chassis.core.spliceArgs() exists.')
  t.ok(chassis.core.emit !== undefined, 'chassis.core.emit() exists.')
  t.ok(chassis.core.createChildDomMonitor !== undefined, 'chassis.core.createChildDomMonitor() exists.')
  t.end()
})
