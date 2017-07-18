const test = require('tape')
const EnterExit = require('./')
const observeEnterExit = EnterExit() // most tests use the same observe fn

const props = (keys, obj) => keys.reduce((acc, key) => {
  acc[key] = obj[key]
  return acc
}, {})

const body = document.body
const bodySize = ({ width, height } = {}) => {
  body.style.width = width ? width + 'px' : 'initial'
  body.style.height = height ? height + 'px' : 'initial'
}

const Div = ({
  top = 0,
  left = 0,
  height = 100,
  width = 100
} = {}) => {
  const div = document.createElement('div')
  div.style.background = '#888'
  div.style.position = 'absolute'
  div.style.top = top + 'px'
  div.style.left = left + 'px'
  div.style.height = height + 'px'
  div.style.width = width + 'px'
  return div
}

test(`listener is called`, t => {
  t.plan(1)
  observeEnterExit(Div(), e => t.pass())
})

test(`returns unobserve function`, t => {
  t.plan(1)
  const unob = observeEnterExit(Div(), e => t.fail('unobserve() did not work. listener was called'))
  unob()
  setTimeout(t.pass)
})

test(`calls listener with { type: 'init' } after registering listener`, t => {
  t.plan(1)
  const div = Div()
  body.appendChild(div)
  const unob = observeEnterExit(div, e => {
    unob()
    body.removeChild(div)
    t.equal(e.type, 'init', e)
  })
})

test(`listener receives event info and the observer entry listener(e, entry)`, t => {
  t.plan(4)
  const div = Div()
  body.appendChild(div)
  const unob = observeEnterExit(div, (e, entry) => {
    unob()
    body.removeChild(div)
    'type position target'.split(' ').forEach(key => t.true(e.hasOwnProperty(key)))
    t.true(entry instanceof IntersectionObserverEntry)
  })
})

test(`init signature { type, position, target }`, t => {
  t.plan(3)
  const div = Div()
  body.appendChild(div)
  const unob = observeEnterExit(div, e => {
    unob()
    body.removeChild(div)
    t.equal(e.type, 'init')
    t.equal(typeof e.position, 'object')
    t.equal(e.target, div)
  })
})

test(`reports position.y correctly. -1 | 0 | 1 === above | in | below the viewport`, t => {
  t.plan(3)
  const fixtures = [
    { top: -10000, y: -1 },
    { top: 0,      y: 0 },
    { top: 100000, y: 1 }
  ]
  fixtures.forEach(fixture => {
    const div = Div({ top: fixture.top })
    body.appendChild(div)
    const unob = observeEnterExit(div, e => {
      unob()
      body.removeChild(div)
      t.equal(e.position.y, fixture.y, String(e.position.y))
    })
  })
})

test(`reports position.x correctly. -1 | 0 | 1 === left-of | in | right-of the viewport`, t => {
  t.plan(3)
  const fixtures = [
    { left: -10000, x: -1 },
    { left: 0,      x: 0 },
    { left: 100000, x: 1 }
  ]
  fixtures.forEach(fixture => {
    const div = Div({ left: fixture.left })
    body.appendChild(div)
    const unob = observeEnterExit(div, e => {
      unob()
      body.removeChild(div)
      t.equal(e.position.x, fixture.x, String(e.position.x))
    })
  })
})

test(`if the element is even 1px out of the viewport, it is NOT position 0`, t => {
  t.plan(2)
  const d1 = Div({ height: 10, width: 10, top: -10, left: -10 })
  const d2 = Div({ height: 10, width: 10, })
  d2.style.top = 'initial'
  d2.style.left = 'initial'
  d2.style.bottom = '-10px'
  d2.style.right = '-10px'
  const fixtures = [
    { target: d1, n: -1 },
    { target: d2, n: 1 }
  ]
  fixtures.forEach(fixture => {
    body.appendChild(fixture.target)
    const unob = observeEnterExit(fixture.target, e => {
      unob()
      body.removeChild(fixture.target)
      t.deepEqual(e.position, { x: fixture.n, y: fixture.n }, JSON.stringify(e.position))
    })
  })
})

test(`if the element is 1px out of the viewport (touching the viewport) and { touching: true }, it is IS position 0`, t => {
  const observe = EnterExit({ touching: true })
  t.plan(2)
  const d1 = Div({ height: 10, width: 10, top: -10, left: -10 })
  const d2 = Div({ height: 10, width: 10, })
  d2.style.top = 'initial'
  d2.style.left = 'initial'
  d2.style.bottom = '-10px'
  d2.style.right = '-10px'
  ;[ d1, d2 ].forEach(target => {
    body.appendChild(target)
    const unob = observe(target, e => {
      unob()
      body.removeChild(target)
      t.deepEqual(e.position, { x: 0, y: 0 }, e.position)
    })
  })
})



test(`if the element has even 1px within the viewport, it IS position 0`, t => {
  t.plan(2)
  const d1 = Div({ height: 10, width: 10, top: -9, left: -9 })
  const d2 = Div({ height: 10, width: 10, })
  d2.style.top = 'initial'
  d2.style.left = 'initial'
  d2.style.bottom = '-9px'
  d2.style.right = '-9px'
  ;[ d1, d2 ].forEach(target => {
    body.appendChild(target)
    const unob = observeEnterExit(d1, e => {
      unob()
      body.removeChild(target)
      t.deepEqual(e.position, { x: 0, y: 0 })
    })
  })
})

test(`reports { type, side } correctly for enter/exit`, t => {
  t.plan(16)
  const div = Div()
  body.appendChild(div)
  const movements = [

    {
      style: { top: -10000, left: 0 },
      result: { type: 'exit', side: 'top', position: { x: 0, y: -1 }  }
    },
    {
      style: { top: 0, left: 0 },
      result: { type: 'enter', side: 'top', position: { x: 0, y: 0 } }
    },


    {
      style: { top: -10000, left: 10000 },
      result: { type: 'exit', side: 'top-right', position: { x: 1, y: -1 }  }
    },
    {
      style: { top: 0, left: 0 },
      result: { type: 'enter', side: 'top-right', position: { x: 0, y: 0 } }
    },


    {
      style: { top: 0, left: 10000 },
      result: { type: 'exit', side: 'right', position: { x: 1, y: 0 }  }
    },
    {
      style: { top: 0, left: 0 },
      result: { type: 'enter', side: 'right', position: { x: 0, y: 0 } }
    },


    {
      style: { top: 10000, left: 10000 },
      result: { type: 'exit', side: 'bottom-right', position: { x: 1, y: 1 }  }
    },
    {
      style: { top: 0, left: 0 },
      result: { type: 'enter', side: 'bottom-right', position: { x: 0, y: 0 } }
    },


    {
      style: { top: 10000, left: 0 },
      result: { type: 'exit', side: 'bottom', position: { x: 0, y: 1 }  }
    },
    {
      style: { top: 0, left: 0 },
      result: { type: 'enter', side: 'bottom', position: { x: 0, y: 0 } }
    },


    {
      style: { top: 10000, left: -10000 },
      result: { type: 'exit', side: 'bottom-left', position: { x: -1, y: 1 }  }
    },
    {
      style: { top: 0, left: 0 },
      result: { type: 'enter', side: 'bottom-left', position: { x: 0, y: 0 } }
    },


    {
      style: { top: 0, left: -10000 },
      result: { type: 'exit', side: 'left', position: { x: -1, y: 0 }  }
    },
    {
      style: { top: 0, left: 0 },
      result: { type: 'enter', side: 'left', position: { x: 0, y: 0 } }
    },


    {
      style: { top: -10000, left: -10000 },
      result: { type: 'exit', side: 'top-left', position: { x: -1, y: -1 }  }
    },
    {
      style: { top: 0, left: 0 },
      result: { type: 'enter', side: 'top-left', position: { x: 0, y: 0 } }
    }

  ]
  let currentMovement
  const unob = observeEnterExit(div, e => {
    if (e.type === 'init') {
    } else {
      t.deepEqual(props([ 'type', 'side', 'position' ], e), currentMovement.result, JSON.stringify(currentMovement.result))
    }
    currentMovement = movements.shift()
    if (currentMovement) {
      div.style.top = currentMovement.style.top + 'px'
      div.style.left = currentMovement.style.left + 'px'
    } else {
      unob()
      body.removeChild(div)
    }
  })
})

test('custom root', t => {
  t.plan(4)
  const root = Div({ width: 100, left: 1000, top: 1000 })
  const target = Div({ width: 100, left: -10000, top: -10000 })
  target.style.backgroundColor = 'red'
  root.appendChild(target)
  body.appendChild(root)
  const observe = EnterExit({ root })
  const unob = observe(target, e => {
    if (e.type === 'init') {
      t.deepEqual(e.position, { x: -1, y: -1 }, JSON.stringify(e.position))
      target.style.left = '-99px'
      target.style.top = '-99px'
    } else {
      unob()
      body.removeChild(root)
      t.equal(e.type, 'enter')
      t.equal(e.side, 'top-left')
      t.deepEqual(e.position, { x: 0, y: 0 }, JSON.stringify(e.position))
    }
  })
})

test('custom root { touching: true }', t => {
  t.plan(4)
  const root = Div({ width: 100, left: 1000, top: 1000 })
  const target = Div({ width: 100, left: -10000, top: -10000 })
  target.style.backgroundColor = 'red'
  root.appendChild(target)
  body.appendChild(root)
  const observe = EnterExit({ root, touching: true })
  const unob = observe(target, e => {
    if (e.type === 'init') {
      t.deepEqual(e.position, { x: -1, y: -1 }, JSON.stringify(e.position))
      target.style.left = '-100px'
      target.style.top = '-100px'
    } else {
      unob()
      body.removeChild(root)
      t.equal(e.type, 'enter')
      t.equal(e.side, 'top-left')
      t.deepEqual(e.position, { x: 0, y: 0 }, JSON.stringify(e.position))
    }
  })
})
