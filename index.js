'use strict'

// dependencies
const dep = {}
dep.gamepad = require('gamepad')

// this won't work on a Mac when developing, ok since hardware is running on Linux
try {
  dep.makePwmDriver = require('adafruit-i2c-pwm-driver')
} catch (err) {
  dep.makePwmDriver = null
}

// settings
const settings = {
  // PWM
  pwmFrequency: 60,
  pwmAddress: 0x40,
  pwmDevice: '/dev/i2c-1',

  // motor values
  m1PwmPin: 0, // pin # on PWM hat
  m1Min: 295, // motor 1 minimum/reverse value
  m1Stop: 390, // motor 1 stop value
  m1Max: 490, // motor 1 max/forward value
  m2PwmPin: 1, // pin # on PWM hat
  m2Min: 295, // motor 2 minimum/reverse value
  m2Stop: 390, // motor 2 stop value
  m2Max: 490, // motor 2 max/forward value
  m3PwmPin: 2, // pin # on PWM hat
  m3Min: 295, // motor 3 minimum/reverse value
  m3Stop: 390, // motor 3 stop value
  m3Max: 490, // motor 3 max/forward value

  // auxillary toggle values
  a1On: 1.0, // aux 1 on value
  a1Off: 0.0, // aux 2 off value
  a2On: 1.0, // aux 1 on value
  a2Off: 0.0, // aux 2 off value

  // timing and increment values
  tInc: 0.05, // value change increment when ramping values at tInt (multiplier 0-1)
  tInt: 70 // number of miliseconds per interval when updating values
}

// !!! let for changing values or use const for non-changing binding (but properties change, confusing...)??
let EuropaDroneController = {
  m1: settings.m1Stop,
  m2: settings.m2Stop,
  m3: settings.m3Stop,
  a1: settings.a1Off,
  a2: settings.a2Off,
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

    dep.gamepad.init()
    // List the state of all currently attached devices (dev purposes only)
    for (var i = 0, l = dep.gamepad.numDevices(); i < l; i++) {
      console.log(i, dep.gamepad.deviceAtIndex())
    }

    // Create a loop and poll for events
    setInterval(dep.gamepad.processEvents, settings.tInt)

    // Scan for new gamepads as a slower rate
    setInterval(dep.gamepad.detectDevices, 500)

    // init PWM output (if on Linux/Pi)
    if (dep.makePwmDriver) {
      self.pwmDriver = dep.makePwmDriver({ address: settings.pwmAddress, device: settings.pwmDevice })
      self.pwmDriver.setPWMFreq(settings.pwmFrequency)

      // reset to idle
      // !!! leave on for now to not stop rover if unresolved gamepad issue kicks in (may take a look myself soon)
      // https://github.com/creationix/node-gamepad/issues/15
      // self.pwmDriver.setPWM(settings.m1PwmPin, 0, settings.m1Stop)
      // self.pwmDriver.setPWM(settings.m2PwmPin, 0, settings.m2Stop)
      // self.pwmDriver.setPWM(settings.m3PwmPin, 0, settings.m3Stop)

      // !!! TEMP test
      /*
      var tmpMod = 240
      var tmpDir = 4
      setInterval(function () {
        tmpMod += tmpDir
        if (tmpMod >= 420) {
          tmpDir = -4
        } else if (tmpMod <= 240) {
          tmpDir = 4
        }

        self.pwmDriver.setPWM(1, 0, tmpMod)
        self.pwmDriver.setPWM(2, 0, tmpMod)
        console.log(tmpMod)
      }, 100)
      */
      /*
      var tmpMod = 384
      tmpMod = 666
      var delay = 50
      setInterval(function () {
      */
        /*
        tmpMod += tmpDir
        if (tmpMod >= 420) {
          tmpDir = -4
        } else if (tmpMod <= 240) {
          tmpDir = 4
        }
        */
        /*
        delay -= 1;
        if(delay <= 0) {
          delay = 50
          tmpMod += 1;
          self.pwmDriver.setPWM(1, 0, tmpMod)
          console.log(tmpMod)
        }

      }, 100)
      */
      // !!!
    } else {
      console.log('NO dep.makePwmDriver')
    }

    // Listen for move events on all gamepads

    // Handle left/right/up/down
    dep.gamepad.on('move', function (id, axis, value) {
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
            console.log('forward')
            self.forwardActive = true
          } else if (value === 1) { // down
            console.log('backward')
            self.backwardActive = true
          } else if (value === 0) { // axis released
            if (self.forwardActive === true) {
              console.log('forward released')
              self.forwardActive = false
            } else if (self.backwardActive === true) {
              console.log('backward released')
              self.backwardActive = false
            }
          }
        } else { // left/right
          if (value === -1) { // left
            console.log('left')
            self.leftActive = true
          } else if (value === 1) { // right
            console.log('right')
            self.rightActive = true
          } else if (value === 0) { // axis released
            if (self.leftActive === true) {
              console.log('left released')
              self.leftActive = false
            } else if (self.rightActive === true) {
              console.log('right released')
              self.rightActive = false
            }
          }
        }
      }
    })

    // Handle button down events
    dep.gamepad.on('down', function (id, num) {
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
    dep.gamepad.on('up', function (id, num) {
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
    if (m1Targ > self.m1 && Math.abs(m1Targ - self.m1) > (m1Targ * settings.tInc / 2)) {
      self.m1 += m1Targ * settings.tInc
    } else if (m1Targ < self.m1 && Math.abs(m1Targ - self.m1) > (m1Targ * settings.tInc / 2)) {
      self.m1 -= m1Targ * settings.tInc
    } else {
      self.m1 = m1Targ
    }

    if (m2Targ > self.m2 && Math.abs(m2Targ - self.m2) > (m2Targ * settings.tInc / 2)) {
      self.m2 += m2Targ * settings.tInc
    } else if (m2Targ < self.m2 && Math.abs(m2Targ - self.m2) > (m2Targ * settings.tInc / 2)) {
      self.m2 -= m2Targ * settings.tInc
    } else {
      self.m2 = m2Targ
    }

    if (m3Targ > self.m3 && Math.abs(m3Targ - self.m3) > (m3Targ * settings.tInc / 2)) {
      self.m3 += m3Targ * settings.tInc
    } else if (m3Targ < self.m3 && Math.abs(m3Targ - self.m3) > (m3Targ * settings.tInc / 2)) {
      self.m3 -= m3Targ * settings.tInc
    } else {
      self.m3 = m3Targ
    }

    if (dep.makePwmDriver) {
      self.pwmDriver.setPWM(settings.m1PwmPin, 0, self.m1)
      self.pwmDriver.setPWM(settings.m2PwmPin, 0, self.m2)
      self.pwmDriver.setPWM(settings.m3PwmPin, 0, self.m3)
    }

    // console.log('m1:', (Math.round(self.m1 * 100) / 100), 'm1Targ:', m1Targ, 'm2:', (Math.round(self.m2 * 100) / 100), 'm2Targ:', m2Targ, 'm3:', (Math.round(self.m3 * 100) / 100), 'm3Targ:', m3Targ)
  }
}

let droneController = Object.create(EuropaDroneController)
droneController.init()
