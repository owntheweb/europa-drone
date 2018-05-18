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
  // PWM hat
  pwmFrequency: 60,
  pwmAddress: 0x40,
  pwmDevice: '/dev/i2c-1',

  // timing and increment values
  tInc: 0.025, // value change increment when ramping values at tInt (multiplier 0-1)
  tInt: 70, // number of miliseconds per interval when updating values
  speedCapMult: 0.5, // make rovs less "zippy" if in a small tank: 0.0 = no speed, 1.0 = full speed
  maxHoldMilisecs: 2500, // max button hold milisecons
  // motor values
  rovs: [
    // rov 1 (first detected controller)
    {
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
      a2Off: 0.0 // aux 2 off value
    },

    // rov 2 (second detected controller)
    {
      m1PwmPin: 3, // pin # on PWM hat
      m1Min: 295, // motor 1 minimum/reverse value
      m1Stop: 390, // motor 1 stop value
      m1Max: 490, // motor 1 max/forward value
      m2PwmPin: 4, // pin # on PWM hat
      m2Min: 295, // motor 2 minimum/reverse value
      m2Stop: 390, // motor 2 stop value
      m2Max: 490, // motor 2 max/forward value
      m3PwmPin: 5, // pin # on PWM hat
      m3Min: 295, // motor 3 minimum/reverse value
      m3Stop: 390, // motor 3 stop value
      m3Max: 490, // motor 3 max/forward value

      // auxillary toggle values
      a1On: 1.0, // aux 1 on value
      a1Off: 0.0, // aux 2 off value
      a2On: 1.0, // aux 1 on value
      a2Off: 0.0 // aux 2 off value
    },

    // rov 3 (third detected controller)
    {
      m1PwmPin: 6, // pin # on PWM hat
      m1Min: 295, // motor 1 minimum/reverse value
      m1Stop: 390, // motor 1 stop value
      m1Max: 490, // motor 1 max/forward value
      m2PwmPin: 7, // pin # on PWM hat
      m2Min: 295, // motor 2 minimum/reverse value
      m2Stop: 390, // motor 2 stop value
      m2Max: 490, // motor 2 max/forward value
      m3PwmPin: 8, // pin # on PWM hat
      m3Min: 295, // motor 3 minimum/reverse value
      m3Stop: 390, // motor 3 stop value
      m3Max: 490, // motor 3 max/forward value

      // auxillary toggle values
      a1On: 1.0, // aux 1 on value
      a1Off: 0.0, // aux 2 off value
      a2On: 1.0, // aux 1 on value
      a2Off: 0.0 // aux 2 off value
    },

    // rov 4 (fourth detected controller)
    {
      m1PwmPin: 9, // pin # on PWM hat
      m1Min: 295, // motor 1 minimum/reverse value
      m1Stop: 390, // motor 1 stop value
      m1Max: 490, // motor 1 max/forward value
      m2PwmPin: 10, // pin # on PWM hat
      m2Min: 295, // motor 2 minimum/reverse value
      m2Stop: 390, // motor 2 stop value
      m2Max: 490, // motor 2 max/forward value
      m3PwmPin: 11, // pin # on PWM hat
      m3Min: 295, // motor 3 minimum/reverse value
      m3Stop: 390, // motor 3 stop value
      m3Max: 490, // motor 3 max/forward value

      // auxillary toggle values
      a1On: 1.0, // aux 1 on value
      a1Off: 0.0, // aux 2 off value
      a2On: 1.0, // aux 1 on value
      a2Off: 0.0 // aux 2 off value
    }
  ]
}

let EuropaDroneController = {
  rovs: settings.rovs.map(function (rov) {
    return {
      m1: rov.m1Stop,
      m2: rov.m2Stop,
      m3: rov.m3Stop,
      a1: rov.a1Off,
      a2: rov.a2Off,
      leftActive: false,
      rightActive: false,
      forwardActive: false,
      backwardActive: false,
      upActive: false,
      downActive: false,
      aux1Active: false,
      aux2Active: false
    }
  }),
  /*
  adjustMaxSpeeds: function () {
    for (let i = 0; i < settings.rovs.length; i++) {
      settings.rovs[i].m1Min
    }
  },
  */

  init: function () {
    let _self = this

    dep.gamepad.init()
    // List the state of all currently attached devices (dev purposes only)
    for (var i = 0, l = dep.gamepad.numDevices(); i < l; i++) {
      console.log(i, dep.gamepad.deviceAtIndex(i))
    }

    // Create a loop and poll for events
    setInterval(dep.gamepad.processEvents, settings.tInt)

    // Scan for new gamepads as a slower rate
    setInterval(dep.gamepad.detectDevices, 500)

    // init PWM output (if on Linux/Pi)
    if (dep.makePwmDriver) {
      _self.pwmDriver = dep.makePwmDriver({ address: settings.pwmAddress, device: settings.pwmDevice })
      _self.pwmDriver.setPWMFreq(settings.pwmFrequency)

      // reset to idle on startup (sometimes the binary that reads controllers crashes, app restarts)
      // why: https://github.com/creationix/node-gamepad/issues/15
      _self.rovs.map(function (rov, rovIndex) {
        _self.pwmDriver.setPWM(settings.rovs[rovIndex].m1PwmPin, 0, _self.rovs[rovIndex].m1)
        _self.pwmDriver.setPWM(settings.rovs[rovIndex].m2PwmPin, 0, _self.rovs[rovIndex].m2)
        _self.pwmDriver.setPWM(settings.rovs[rovIndex].m3PwmPin, 0, _self.rovs[rovIndex].m3)
        return false
      })

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

        _self.pwmDriver.setPWM(0, 0, tmpMod)
        console.log(tmpMod)
      }, 100)
      */
      // END TEMP TEST
    } else {
      console.log('NO dep.makePwmDriver')
    }

    // Listen for move events on all gamepads

    // Handle left/right/up/down
    dep.gamepad.on('move', function (padIndex, axis, value) {
      /*
      console.log('move', {
        id: id,
        axis: axis,
        value: value
      })
      */

      value = Math.round(value)

      // axis button pressed
      if (axis === 1) { // up/down
        if (value === -1) { // up
          console.log('forward, gamepad: ' + padIndex)
          _self.rovs[padIndex].forwardActive = true
          _self.setButtonTimeout(padIndex, 'forward')
        } else if (value === 1) { // down
          console.log('backward, gamepad: ' + padIndex)
          _self.rovs[padIndex].backwardActive = true
          _self.setButtonTimeout(padIndex, 'backward')
        } else if (value === 0) { // axis released
          if (_self.rovs[padIndex].forwardActive === true) {
            console.log('forward released, gamepad: ' + padIndex)
            _self.rovs[padIndex].forwardActive = false
            _self.clearButtonTimeout(padIndex, 'forward')
          } else if (_self.rovs[padIndex].backwardActive === true) {
            console.log('backward released, gamepad: ' + padIndex)
            _self.rovs[padIndex].backwardActive = false
            _self.clearButtonTimeout(padIndex, 'backward')
          }
        }
      } else { // left/right
        if (value === -1) { // left
          console.log('left, gamepad: ' + padIndex)
          _self.rovs[padIndex].leftActive = true
          _self.setButtonTimeout(padIndex, 'left')
        } else if (value === 1) { // right
          console.log('right, gamepad: ' + padIndex)
          _self.rovs[padIndex].rightActive = true
          _self.setButtonTimeout(padIndex, 'right')
        } else if (value === 0) { // axis released
          if (_self.rovs[padIndex].leftActive === true) {
            console.log('left released, gamepad: ' + padIndex)
            _self.rovs[padIndex].leftActive = false
            _self.clearButtonTimeout(padIndex, 'left')
          } else if (_self.rovs[padIndex].rightActive === true) {
            console.log('right released, gamepad: ' + padIndex)
            _self.rovs[padIndex].rightActive = false
            _self.clearButtonTimeout(padIndex, 'right')
          }
        }
      }
    })

    // Handle button down events
    dep.gamepad.on('down', function (padIndex, num) {
      /*
      console.log('down', {
        id: id,
        num: num
      })
      */

      if (num === 0) { // B on NES USB controller
        // console.log('B')
        console.log('down, gamepad: ' + padIndex)
        _self.rovs[padIndex].downActive = true
        _self.setButtonTimeout(padIndex, 'down')
      } else if (num === 1) { // A on NES USB controller
        // console.log('A')
        console.log('up, gamepad: ' + padIndex)
        _self.rovs[padIndex].upActive = true
        _self.setButtonTimeout(padIndex, 'up')
      } else if (num === 8) { // select on NES USB controller
        // console.log('select')
        if (_self.rovs[padIndex].aux1Active === false) {
          console.log('aux 1 on, gamepad: ' + padIndex)
          _self.rovs[padIndex].aux1Active = true
        } else {
          console.log('aux 1 off, gamepad: ' + padIndex)
          _self.rovs[padIndex].aux1Active = false
        }
      } else if (num === 9) { // start on NES USB controller
        // console.log('start')
        if (_self.rovs[padIndex].aux2Active === false) {
          console.log('aux 2 on, gamepad: ' + padIndex)
          _self.rovs[padIndex].aux2Active = true
        } else {
          console.log('aux 2 off, gamepad: ' + padIndex)
          _self.rovs[padIndex].aux2Active = false
        }
      }
    })

    // Handle button up events
    dep.gamepad.on('up', function (padIndex, num) {
      /*
      console.log('down', {
        id: id,
        num: num
      })
      */

      // support one controller for now
      if (num === 0) { // B on NES USB controller
        console.log('down released, gamepad: ' + padIndex)
        _self.rovs[padIndex].downActive = false
        _self.clearButtonTimeout(padIndex, 'down')
      } else if (num === 1) { // A on NES USB controller
        // console.log('A released')
        console.log('up released, gamepad: ' + padIndex)
        _self.rovs[padIndex].upActive = false
        _self.clearButtonTimeout(padIndex, 'up')
      } else if (num === 8) { // select on NES USB controller
        // console.log('select released')
      } else if (num === 9) { // start on NES USB controller
        // console.log('start released')
      }
    })

    // Ramp motors acceleration
    setInterval(function () {
      _self.rampMotors()
    }, settings.tInt)
  },

  // promote good behavior and overcome cheap game pad occasional missing up events
  setButtonTimeout: function (rovIndex, direction) {
    let _self = this
    _self.clearButtonTimeout(rovIndex, direction)

    switch (direction) {
      case 'forward':
        _self.rovs[rovIndex].forwardTimeout = setTimeout(function (rovIndex, direction) {
          _self.rovs[rovIndex].forwardActive = false
          _self.clearButtonTimeout(rovIndex, direction)
        }.bind(_self, rovIndex, direction), settings.maxHoldMilisecs)
        break
      case 'backward':
        _self.rovs[rovIndex].backwardTimeout = setTimeout(function (rovIndex, direction) {
          _self.rovs[rovIndex].backwardActive = false
          _self.clearButtonTimeout(rovIndex, direction)
        }.bind(_self, rovIndex, direction), settings.maxHoldMilisecs)
        break
      case 'left':
        _self.rovs[rovIndex].leftTimeout = setTimeout(function (rovIndex, direction) {
          _self.rovs[rovIndex].leftActive = false
          _self.clearButtonTimeout(rovIndex, direction)
        }.bind(_self, rovIndex, direction), settings.maxHoldMilisecs)
        break
      case 'right':
        _self.rovs[rovIndex].rightTimeout = setTimeout(function (rovIndex, direction) {
          _self.rovs[rovIndex].rightActive = false
          _self.clearButtonTimeout(rovIndex, direction)
        }.bind(_self, rovIndex, direction), settings.maxHoldMilisecs)
        break
      case 'down':
        _self.rovs[rovIndex].downTimeout = setTimeout(function (rovIndex, direction) {
          _self.rovs[rovIndex].downActive = false
          _self.clearButtonTimeout(rovIndex, direction)
        }.bind(_self, rovIndex, direction), settings.maxHoldMilisecs)
        break
      case 'up':
        _self.rovs[rovIndex].upTimeout = setTimeout(function (rovIndex, direction) {
          _self.rovs[rovIndex].upActive = false
          _self.clearButtonTimeout(rovIndex, direction)
        }.bind(_self, rovIndex, direction), settings.maxHoldMilisecs)
        break
    }
  },

  // clear button timeout
  clearButtonTimeout: function (rovIndex, direction) {
    let _self = this
    switch (direction) {
      case 'forward':
        if (_self.rovs[rovIndex].hasOwnProperty('forwardTimeout') && typeof _self.rovs[rovIndex].forwardTimeout !== 'undefined') {
          clearTimeout(_self.rovs[rovIndex].forwardTimeout)
        }
        break
      case 'backward':
        if (_self.rovs[rovIndex].hasOwnProperty('backwardTimeout') && typeof _self.rovs[rovIndex].backwardTimeout !== 'undefined') {
          clearTimeout(_self.rovs[rovIndex].backwardTimeout)
        }
        break
      case 'left':
        if (_self.rovs[rovIndex].hasOwnProperty('leftTimeout') && typeof _self.rovs[rovIndex].leftTimeout !== 'undefined') {
          clearTimeout(_self.rovs[rovIndex].leftTimeout)
        }
        break
      case 'right':
        if (_self.rovs[rovIndex].hasOwnProperty('rightTimeout') && typeof _self.rovs[rovIndex].rightTimeout !== 'undefined') {
          clearTimeout(_self.rovs[rovIndex].rightTimeout)
        }
        break
      case 'down':
        if (_self.rovs[rovIndex].hasOwnProperty('downTimeout') && typeof _self.rovs[rovIndex].downTimeout !== 'undefined') {
          clearTimeout(_self.rovs[rovIndex].downTimeout)
        }
        break
      case 'up':
        if (_self.rovs[rovIndex].hasOwnProperty('upTimeout') && typeof _self.rovs[rovIndex].upTimeout !== 'undefined') {
          clearTimeout(_self.rovs[rovIndex].upTimeout)
        }
        break
    }
  },

  // Ramp motors acceleration
  rampMotors: function () {
    let _self = this // !!! should I start using ES6 arrows for events instead?

    _self.rovs.map(function (rov, rovIndex) {
      let m1Targ, m2Targ, m3Targ

      // forward movement using motors 1 (forward facing left motor) and 2 (forward facing right motor)
      if (_self.rovs[rovIndex].forwardActive === true && _self.rovs[rovIndex].leftActive === false && _self.rovs[rovIndex].rightActive === false) { // full forward
        m1Targ = settings.rovs[rovIndex].m1Max
        m2Targ = settings.rovs[rovIndex].m2Max
      } else if (_self.rovs[rovIndex].forwardActive === true && _self.rovs[rovIndex].leftActive === true) { // forward, lean left
        m1Targ = settings.rovs[rovIndex].m1Stop + ((settings.rovs[rovIndex].m1Max - settings.rovs[rovIndex].m1Stop) * 0.50)
        m2Targ = settings.rovs[rovIndex].m2Max
      } else if (_self.rovs[rovIndex].forwardActive === true && _self.rovs[rovIndex].rightActive === true) { // forward, lean right
        m1Targ = settings.rovs[rovIndex].m1Max
        m2Targ = settings.rovs[rovIndex].m2Max + ((settings.rovs[rovIndex].m2Stop - settings.rovs[rovIndex].m2Max) * 0.50)
      } else if (_self.rovs[rovIndex].backwardActive === false && _self.rovs[rovIndex].leftActive === false && _self.rovs[rovIndex].rightActive === false) {
        m1Targ = settings.rovs[rovIndex].m1Stop
        m2Targ = settings.rovs[rovIndex].m2Stop
      }

      // backward movement
      if (_self.rovs[rovIndex].backwardActive === true && _self.rovs[rovIndex].leftActive === false && _self.rovs[rovIndex].rightActive === false) { // full reverse
        m1Targ = settings.rovs[rovIndex].m1Min
        m2Targ = settings.rovs[rovIndex].m2Min
      } else if (_self.rovs[rovIndex].backwardActive === true && _self.rovs[rovIndex].leftActive === true) { // reverse, lean left
        m1Targ = settings.rovs[rovIndex].m1Min + ((settings.rovs[rovIndex].m1Stop - settings.rovs[rovIndex].m1Min) * 0.50)
        m2Targ = settings.rovs[rovIndex].m2Min
      } else if (_self.rovs[rovIndex].backwardActive === true && _self.rovs[rovIndex].rightActive === true) { // reverse, lean right
        m1Targ = settings.rovs[rovIndex].m1Min
        m2Targ = settings.rovs[rovIndex].m2Min + ((settings.rovs[rovIndex].m2Stop - settings.rovs[rovIndex].m2Min) * 0.50)
      } else if (_self.rovs[rovIndex].forwardActive === false && _self.rovs[rovIndex].leftActive === false && _self.rovs[rovIndex].rightActive === false) {
        m1Targ = settings.rovs[rovIndex].m1Stop
        m2Targ = settings.rovs[rovIndex].m2Stop
      }

      // left turn
      if (_self.rovs[rovIndex].leftActive === true && _self.rovs[rovIndex].forwardActive === false && _self.rovs[rovIndex].backwardActive === false) {
        m1Targ = settings.rovs[rovIndex].m1Min
        m2Targ = settings.rovs[rovIndex].m2Max
      }

      // right turn
      if (_self.rovs[rovIndex].rightActive === true && _self.rovs[rovIndex].forwardActive === false && _self.rovs[rovIndex].backwardActive === false) {
        m1Targ = settings.rovs[rovIndex].m1Max
        m2Targ = settings.rovs[rovIndex].m2Min
      }

      // submerge
      if (_self.rovs[rovIndex].downActive === true && _self.rovs[rovIndex].upActive === false) {
        m3Targ = settings.rovs[rovIndex].m3Max
      }

      // surface
      if (_self.rovs[rovIndex].upActive === true && _self.rovs[rovIndex].downActive === false) {
        m3Targ = settings.rovs[rovIndex].m3Min
      }

      // no vertical movement (also if pressing both buttons at once)
      if ((_self.rovs[rovIndex].downActive === false && _self.rovs[rovIndex].upActive === false) || (_self.rovs[rovIndex].downActive === true && _self.rovs[rovIndex].upActive === true)) {
        m3Targ = settings.rovs[rovIndex].m3Stop
      }

      // ease motor values
      if (m1Targ > _self.rovs[rovIndex].m1 && Math.abs(m1Targ - _self.rovs[rovIndex].m1) > (m1Targ * settings.tInc / 2)) {
        _self.rovs[rovIndex].m1 += m1Targ * settings.tInc
      } else if (m1Targ < _self.rovs[rovIndex].m1 && Math.abs(m1Targ - _self.rovs[rovIndex].m1) > (m1Targ * settings.tInc / 2)) {
        _self.rovs[rovIndex].m1 -= m1Targ * settings.tInc
      } else {
        _self.rovs[rovIndex].m1 = m1Targ
      }

      if (m2Targ > _self.rovs[rovIndex].m2 && Math.abs(m2Targ - _self.rovs[rovIndex].m2) > (m2Targ * settings.tInc / 2)) {
        _self.rovs[rovIndex].m2 += m2Targ * settings.tInc
      } else if (m2Targ < _self.rovs[rovIndex].m2 && Math.abs(m2Targ - _self.rovs[rovIndex].m2) > (m2Targ * settings.tInc / 2)) {
        _self.rovs[rovIndex].m2 -= m2Targ * settings.tInc
      } else {
        _self.rovs[rovIndex].m2 = m2Targ
      }

      if (m3Targ > _self.rovs[rovIndex].m3 && Math.abs(m3Targ - _self.rovs[rovIndex].m3) > (m3Targ * settings.tInc / 2)) {
        _self.rovs[rovIndex].m3 += m3Targ * settings.tInc
      } else if (m3Targ < _self.rovs[rovIndex].m3 && Math.abs(m3Targ - _self.rovs[rovIndex].m3) > (m3Targ * settings.tInc / 2)) {
        _self.rovs[rovIndex].m3 -= m3Targ * settings.tInc
      } else {
        _self.rovs[rovIndex].m3 = m3Targ
      }

      if (dep.makePwmDriver) {
        _self.pwmDriver.setPWM(settings.rovs[rovIndex].m1PwmPin, 0, _self.rovs[rovIndex].m1)
        _self.pwmDriver.setPWM(settings.rovs[rovIndex].m2PwmPin, 0, _self.rovs[rovIndex].m2)
        _self.pwmDriver.setPWM(settings.rovs[rovIndex].m3PwmPin, 0, _self.rovs[rovIndex].m3)
      }

      if (rovIndex === 0) {
        console.log('rov:', rovIndex, 'm1Targ:', m1Targ, 'm2Targ:', m2Targ, 'm3Targ:', m3Targ)
      }

      return false
    })
  }
}

let droneController = Object.create(EuropaDroneController)
droneController.init()
