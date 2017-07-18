# enter-exit

Register a listener for an element entering and exiting the viewport or other parent element.

## install

```sh
$ npm install enter-exit
```

## example

```js
const observeEnterAndExit = require('enter-exit')

// Imagine `aDomElement` is 5000px down the page and out of view

observeEnterAndExit(aDomElement, e => {
  if (e.type === 'init') {
    // this is called immediately with the starting position of the target
    e.position // { x: 0, y: 1 }

    // this will bring the target into view
    window.scrollTo(0, 5000)
  } else if (e.type === 'enter') {
    // because we scrolled down to the element, it came into view from the bottom of the view
    e.side // 'bottom'
    e.position // { x: 0, y: 0 }

    // scroll further down the page
    window.scrollTo(0, 9000)
  } else {
    // because we scroll past the element, it exited the view through the top of the view
    e.type // 'exit'
    e.side // 'top'
    e.position // { x: 0, y: -1 }
  }
})
```

## IntersectionObserver support

This package uses [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). You probably need to polyfill it since it is not well supported yet. [polyfill.io](https://polyfill.io) is a good way to do that.

## API

### `EnterExit({ root, touching })`

Creates a function for observing an element entering and exiting the `root`.

```js
const observeEnterAndExit = EnterExit()

observeEnterAndExit(target, listener)
```

#### `root`

When no `root` is given, the browser viewport will be used. You may pass a DOM element as `root`, and that element will act as the viewport for observation instead.

#### `touching = false`

By default, a target's listener will be called when it enters the `root` by at least 1px, and if it exits the root by having 0px within the root. If you set `touching: true`, the calculation is offset by a single pixel so that if the target touches the boundary, it counts as an `enter`, and `exit` is calculated as the target not only leaving the root, but moving 1px beyond, so as to no longer be touching the root.

In other words, `touching` makes the observer look for collision between `target` and `root`. However, targets have to be children of `root`, so it's probably not as useful for collision detection as something made for that purpose.

#### `observeEnterAndExit(target, listener)`

Register a listener to be called when `target` enters and exits `root` Returns an `unobserve` function you can use to stop listening.

```js
const unobserve = observeEnterAndExit(target, listener)
```

##### `target`

The DOM element to observe.

##### `listener`

Function that receives an object with information about the event, and an [`IntersectionObserverEntry`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry).

```js
observeEnterAndExit(target, (e, entry) => {
  e.type // 'enter'
  e.side // 'bottom'
  entry.boundingClientRect // object
})
```

### event information

```js
{ type, side, position, target }
```

#### `e.type`

The type of event.

##### `type: 'init'`

The listener is always called with `type: 'init'` after being registered and reports the target's starting position.

##### `type: 'enter'`

The listener is called with `type: enter` when the target enters `root`

##### `type: 'exit'`

The listener is called with `type: exit` when the target exits `root`

#### `e.side`

A human friendly description of where the `enter` or `exit` occurred.

On `init`, `side` describes where the element is in relation to the `root`. If it is already within `root`, `{ side: undefined }`

Possible values:

  - `'top'`
  - `'right'`
  - `'bottom'`
  - `'left'`
  - `'top-left'`
  - `'top-right'`
  - `'bottom-right'`
  - `'bottom-left'`

In any normal scrolling situation, an element can't enter or exit from/to a corner, so `top`, `right`, `bottom`, and `left` should usually be what you need. The others are included just in case you have a wild Friday.


#### `e.position`

An object containing the `x` and `y` position of the target, represented as `-1`, `0`, or `1`.

`-1` means the target is before the `root` on the axis.

`0` means the target is within the `root` on the axis.

`1` means the target is after the `root` on the axis.

In the following grid, the center block is `root`.

```
[ -1 -1 ] [ 0 -1 ] [ 1 -1 ]
[ -1  0 ] [ 0  0 ] [ 1  0 ]
[ -1  1 ] [ 0  1 ] [ 1  1 ]
```

If the target has a single px inside of `root` on an axis, the target is considered at `0` on that axis.

```js
// bottom-left of root
{ position: { x: -1, y: 1 } }
```

#### `e.target`

The target element.
