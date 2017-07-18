const InsularObserver = require('insular-observer')
const ifElse = (predicate, a, b) => x => predicate(x) ? a(x) : b(x)

const axisLookup = {
  x: { closeSide: 'left', farSide: 'right', relevantSize: 'width' },
  y: { closeSide: 'top', farSide: 'bottom', relevantSize: 'height' }
}

const calcAxisPosition = (axis, { boundingClientRect, rootBounds }) => {
  const { closeSide, farSide, relevantSize } = axisLookup[axis]

  const targetEnd = boundingClientRect[farSide]
  const rootStart = rootBounds[closeSide]
  if (targetEnd < rootStart) {
    return -1
  }

  const targetStart = targetEnd - boundingClientRect[relevantSize]
  const rootEnd = rootBounds[farSide]
  if (targetStart > rootEnd) {
    return 1
  }

  return 0
}

const positionDescriptions = {
  '0,0': undefined,
  '0,-1': 'top',
  '1,0': 'right',
  '0,1': 'bottom',
  '-1,0': 'left',
  '-1,-1': 'top-left',
  '1,-1': 'top-right',
  '1,1': 'bottom-right',
  '-1,1': 'bottom-left'
}

const describe = ({ x, y }) => positionDescriptions[`${x},${y}`]

const makeObservationCallback = (callback) => {
  let lastPosition

  return e => {
    const isInit = lastPosition === undefined
    const position = {
      x: calcAxisPosition('x', e),
      y: calcAxisPosition('y', e)
    }

    const result = Object.assign({ target: e.target, position }, ifElse(
      _ => isInit,
      _ => ({ type: 'init', side: describe(position) }),
      _ => ifElse(
        _ => e.isIntersecting,
        _ => ({ type: 'enter', side: describe(lastPosition) }),
        _ => ({ type: 'exit', side: describe(position) })
      )()
    )())

    lastPosition = position
    callback(result, e)
  }
}

const EnterExit = ({ root = undefined, touching = false } = {}) => {
  const rootMargin = touching ? '0px' : '-1px'
  const observe = InsularObserver(IntersectionObserver, { root, rootMargin, threshold: [ 0 ] })
  const observeEnterAndExit = (element, listener) => {
    const enterExitListener = makeObservationCallback(listener)
    return observe(element, enterExitListener)
  }
  return observeEnterAndExit
}

module.exports = EnterExit
