let unreached = event => {
  assert_unreached(event.error.name + ": " + event.error.message);
};

let properties = {
  'AmbientLightSensor' : ['timestamp', 'illuminance'],
  'Accelerometer' : ['timestamp', 'x', 'y', 'z'],
  'LinearAccelerationSensor' : ['timestamp', 'x', 'y', 'z'],
  'Gyroscope' : ['timestamp', 'x', 'y', 'z'],
  'Magnetometer' : ['timestamp', 'x', 'y', 'z'],
  'AbsoluteOrientationSensor' : ['timestamp', 'quaternion'],
  'RelativeOrientationSensor' : ['timestamp', 'quaternion']
};

function assert_reading_not_null(sensor) {
  for (let property in properties[sensor.constructor.name]) {
    let propertyName = properties[sensor.constructor.name][property];
    assert_not_equals(sensor[propertyName], null);
  }
}

function assert_reading_null(sensor) {
  for (let property in properties[sensor.constructor.name]) {
    let propertyName = properties[sensor.constructor.name][property];
    assert_equals(sensor[propertyName], null);
  }
}

function reading_to_array(sensor) {
  let arr = new Array();
  for (let property in properties[sensor.constructor.name]) {
    let propertyName = properties[sensor.constructor.name][property];
    arr[property] = sensor[propertyName];
  }
  return arr;
}

// Wraps callback and calls rejectFunc if callback throws an error.
class CallbackWrapper {
  constructor(callback, rejectFunc) {
    this.wrapperFunc_ = (args) => {
      try {
        callback(args);
      } catch(e) {
        rejectFunc(e);
      }
    }
  }
  get callback() {
    return this.wrapperFunc_;
  }
}

function runGenericSensorTests(sensorType) {

  promise_test(t => {
    let sensor = new sensorType();
    sensor.start();

    // Create a focused editbox inside a cross-origin iframe, sensor notification must suspend.
    const iframeSrc = 'data:text/html;charset=utf-8,<html><body><input type="text" autofocus></body></html>';
    let iframe = document.createElement('iframe');
    iframe.src = encodeURI(iframeSrc);

    return new Promise((resolve, reject) => {
        let wrapper = new CallbackWrapper(() => {
          assert_reading_not_null(sensor);
          resolve(sensor.timestamp);
        }, reject);

        sensor.onreading = wrapper.callback;
        sensor.onerror = reject;
    })
    .then(cachedTimestamp => new Promise((resolve, reject) => {
      let wrapper = new CallbackWrapper(() => {
        console.log("onload");
        sensor.onreading = reject;
        sensor.onerror = reject;
        assert_equals(sensor.timestamp, cachedTimestamp);
        console.log(document.activeElement);
        resolve(cachedTimestamp);
      }, reject);
      iframe.onload = wrapper.callback;
      document.body.appendChild(iframe);
//      setTimeout(() => {resolve(cachedTimestamp);}, 100);
      }))
    .then(cachedTimestamp => new Promise((resolve, reject) => {
      let wrapper = new CallbackWrapper(() => {
        assert_greater_than(sensor.timestamp, cachedTimestamp);
        resolve();
      }, reject);

      sensor.onreading = wrapper.callback;
      sensor.onerror = reject;

      window.focus();
//      setTimeout(() => { window.focus(); }, 100);
    }))
    .then(() => {
      sensor.stop();
      document.body.removeChild(iframe);
    });
  }, `${sensorType.name}: sensor receives suspend / resume notifications when`
              + ` cross-origin subframe is focused`);
}

function checkFrequencyHintWorks(sensorType) {

  promise_test(t => {
    let fastSensor = new sensorType({frequency: 30});
    let slowSensor = new sensorType({frequency: 5});
    slowSensor.start();

    return new Promise((resolve, reject) => {
        let fastSensorNotifiedCounter = 0;
        let slowSensorNotifiedCounter = 0;
        let fastSensorWrapper = new CallbackWrapper(() => {
          fastSensorNotifiedCounter++;
        }, reject);
        let slowSensorWrapper = new CallbackWrapper(() => {
          slowSensorNotifiedCounter++;
          if (slowSensorNotifiedCounter == 1) {
              fastSensor.start();
          } else if (slowSensorNotifiedCounter == 3) {
            fastSensor.stop();
            slowSensor.stop();
            resolve(fastSensorNotifiedCounter);
          }
        }, reject);

        fastSensor.onreading = fastSensorWrapper.callback;
        slowSensor.onreading = slowSensorWrapper.callback;
        fastSensor.onerror = reject;
        slowSensor.onerror = reject;
    })
    .then(fastSensorNotifiedCounter => {
      assert_true(fastSensorNotifiedCounter > 2,
                  "Fast sensor overtakes the slow one");
    });
  }, `${sensorType.name}: frequency hint works.`);

}
