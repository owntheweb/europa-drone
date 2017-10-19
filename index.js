'use strict'

// dependencies
const gamepad = require('gamepad')
//const gpio = require('rpi-gpio')

// settings
const settings = {
  // motor values
  m1Min: -1.0, // motor 1 minimum/reverse value
  m1Stop: 0.0, // motor 1 stop value
  m1Max: 1.0, // motor 1 max/forward value
  m2Min: -1.0, // motor 2 minimum/reverse value
  m2Stop: 0.0, // motor 2 stop value
  m2Max: 1.0, // motor 2 max/forward value
  m3Min: -1.0, // motor 3 minimum/reverse value
  m3Stop: 0.0, // motor 3 stop value
  m3Max: 1.0, // motor 3 max/forward value

  // auxillary toggle values
  a1On: 1.0, // aux 1 on value
  a1Off: 0.0, // aux 2 off value
  a2On: 1.0, // aux 1 on value
  a2Off: 0.0, // aux 2 off value

  // timing and increment values
  tInc: 0.1, // value change increment when ramping values at tInt
  tInt: 50, // number of miliseconds per interval when updating values

  // Raspberry Pi pins
  m1Out: 0,
  m2Out: 0,
  m3Out: 0
}

// !!! let for changing values or use const for non-changing binding (but properties change, confusing...)??
let EuropaDroneController = {
  m1: 0,
  m2: 0,
  m3: 0,
  a1: 0,
  a2: 0,
  leftActive: false,
  rightActive: false,
  forwardActive: false,
  backwardActive: false,
  upActive: false,
  downActive: false,
  aux1Active: false,
  aux2Active: false,

  init: function () {
    let self = this // !!! should I start using ES6 arrows for events instead?

    gamepad.init()
    // List the state of all currently attached devices (dev purposes only)
    for (var i = 0, l = gamepad.numDevices(); i < l; i++) {
      console.log(i, gamepad.deviceAtIndex())
    }

    // Create a loop and poll for events
    setInterval(gamepad.processEvents, settings.tInt)

    // Scan for new gamepads as a slower rate
    setInterval(gamepad.detectDevices, 500)

    // Listen for move events on all gamepads

    // Handle left/right/up/down
    gamepad.on('move', function (id, axis, value) {
      /*
      console.log('move', {
        id: id,
        axis: axis,
        value: value
      })
      */

      value = Math.round(value)

      // support one controller for now
      if (id === 0) {
        // axis button pressed
        if (axis === 1) { // up/down
          if (value === -1) { // up
            // console.log('forward')
            self.forwardActive = true
          } else if (value === 1) { // down
            // console.log('backward')
            self.backwardActive = true
          } else if (value === 0) { // axis released
            if (self.forwardActive === true) {
              // console.log('forward released')
              self.forwardActive = false
            } else if (self.backwardActive === true) {
              // console.log('backward released')
              self.backwardActive = false
            }
          }
        } else { // left/right
          if (value === -1) { // left
            // console.log('left')
            self.leftActive = true
          } else if (value === 1) { // right
            // console.log('right')
            self.rightActive = true
          } else if (value === 0) { // axis released
            if (self.leftActive === true) {
              // console.log('left released')
              self.leftActive = false
            } else if (self.rightActive === true) {
              // console.log('right released')
              self.rightActive = false
            }
          }
        }
      }
    })

    // Handle button down events
    gamepad.on('down', function (id, num) {
      /*
      console.log('down', {
        id: id,
        num: num
      })
      */

      // support one controller for now
      if (id === 0) {
        if (num === 0) { // B on NES USB controller
          // console.log('B')
          console.log('down')
          self.downActive = true
        } else if (num === 1) { // A on NES USB controller
          // console.log('A')
          console.log('up')
          self.upActive = true
        } else if (num === 8) { // select on NES USB controller
          // console.log('select')
          if (self.aux1Active === false) {
            console.log('aux 1 on')
            self.aux1Active = true
          } else {
            console.log('aux 1 off')
            self.aux1Active = false
          }
        } else if (num === 9) { // start on NES USB controller
          // console.log('start')
          if (self.aux2Active === false) {
            console.log('aux 2 on')
            self.aux2Active = true
          } else {
            console.log('aux 2 off')
            self.aux2Active = false
          }
        }
      }
    })

    // Handle button up events
    gamepad.on('up', function (id, num) {
      /*
      console.log('down', {
        id: id,
        num: num
      })
      */

      // support one controller for now
      if (id === 0) {
        if (num === 0) { // B on NES USB controller
          console.log('down released')
          self.downActive = false
        } else if (num === 1) { // A on NES USB controller
          // console.log('A released')
          console.log('up released')
          self.upActive = false
        } else if (num === 8) { // select on NES USB controller
          // console.log('select released')
        } else if (num === 9) { // start on NES USB controller
          // console.log('start released')
        }
      }
    })

    // Ramp motors acceleration
    setInterval(function () {
      self.rampMotors()
    }, settings.tInt)
  },

  // Ramp motors acceleration
  rampMotors: function () {
    let self = this // !!! should I start using ES6 arrows for events instead?
    let m1Targ, m2Targ, m3Targ

    // forward movement using motors 1 (forward facing left motor) and 2 (forward facing right motor)
    if (self.forwardActive === true && self.leftActive === false && self.rightActive === false) { // full forward
      m1Targ = settings.m1Max
      m2Targ = settings.m2Max
    } else if (self.forwardActive === true && self.leftActive === true) { // forward, lean left
      m1Targ = settings.m1Max - (settings.m1Stop + settings.m1Max * 0.50)
      m2Targ = settings.m2Max
    } else if (self.forwardActive === true && self.rightActive === true) { // forward, lean right
      m1Targ = settings.m1Max
      m2Targ = settings.m2Max - (settings.m2Stop + settings.m2Max * 0.50)
    } else if (self.backwardActive === false && self.leftActive === false && self.rightActive === false) {
      m1Targ = settings.m1Stop
      m2Targ = settings.m2Stop
    }

    // backward movement
    if (self.backwardActive === true && self.leftActive === false && self.rightActive === false) { // full reverse
      m1Targ = settings.m1Min
      m2Targ = settings.m2Min
    } else if (self.backwardActive === true && self.leftActive === true) { // reverse, lean left
      m1Targ = settings.m1Min - (settings.m1Stop + settings.m1Min * 0.50)
      m2Targ = settings.m2Min
    } else if (self.backwardActive === true && self.rightActive === true) { // reverse, lean right
      m1Targ = settings.m1Min
      m2Targ = settings.m2Min - (settings.m2Stop + settings.m2Min * 0.50)
    } else if (self.forwardActive === false && self.leftActive === false && self.rightActive === false) {
      m1Targ = settings.m1Stop
      m2Targ = settings.m2Stop
    }

    // left turn
    if (self.leftActive === true && self.forwardActive === false && self.backwardActive === false) {
      m1Targ = settings.m1Min
      m2Targ = settings.m2Max
    }

    // right turn
    if (self.rightActive === true && self.forwardActive === false && self.backwardActive === false) {
      m1Targ = settings.m1Max
      m2Targ = settings.m2Min
    }

    // submerge
    if (self.downActive === true && self.upActive === false) {
      m3Targ = settings.m3Max
    }

    // surface
    if (self.upActive === true && self.downActive === false) {
      m3Targ = settings.m3Min
    }

    // no vertical movement (also if pressing both buttons at once)
    if ((self.downActive === false && self.upActive === false) || (self.downActive === true && self.upActive === true)) {
      m3Targ = settings.m3Stop
    }

    // ease motor values
    // !!! crude linear for now, update later
    if (m1Targ > self.m1 && Math.abs(m1Targ - self.m1) > settings.tInc / 2) {
      self.m1 += settings.tInc
    } else if (m1Targ < self.m1 && Math.abs(m1Targ - self.m1) > settings.tInc / 2) {
      self.m1 -= settings.tInc
    } else {
      self.m1 = m1Targ
    }

    if (m2Targ > self.m2 && Math.abs(m2Targ - self.m2) > settings.tInc / 2) {
      self.m2 += settings.tInc
    } else if (m2Targ < self.m2 && Math.abs(m2Targ - self.m2) > settings.tInc / 2) {
      self.m2 -= settings.tInc
    } else {
      self.m2 = m2Targ
    }

    if (m3Targ > self.m3 && Math.abs(m3Targ - self.m3) > settings.tInc / 2) {
      self.m3 += settings.tInc
    } else if (m3Targ < self.m3 && Math.abs(m3Targ - self.m3) > settings.tInc / 2) {
      self.m3 -= settings.tInc
    } else {
      self.m3 = m3Targ
    }

    console.log('m1:', (Math.round(self.m1 * 100) / 100), 'm1Targ:', m1Targ, 'm2:', (Math.round(self.m2 * 100) / 100), 'm2Targ:', m2Targ, 'm3:', (Math.round(self.m3 * 100) / 100), 'm3Targ:', m3Targ)
  }
}

let droneController = Object.create(EuropaDroneController)
droneController.init()

 // https://www.npmjs.com/package/rpi-gpio
