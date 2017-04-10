let unreached = event => {
  assert_unreached(event.error.name + ":" + event.error.message);
};

function runGenericSensorTests(sensorType, verifyReading, readingToArray) {
  async_test(t => {
    let sensor = new sensorType();
    sensor.onchange = t.step_func_done(() => {
      assert_true(verifyReading(sensor));
      assert_true(sensor.activated);
      sensor.stop();
    });
    sensor.onerror = t.step_func_done(unreached);
    sensor.start();
  }, "event change fired");

  async_test(t => {
    let sensor1 = new sensorType();
    let sensor2 = new sensorType();
    sensor1.onactivate = t.step_func_done(() => {
      // Reading values are correct for both sensors.
      assert_true(verifyReading(sensor1));
      assert_true(verifyReading(sensor2));
      //After first sensor stops its reading values are null,
      //reading values for the second sensor remains
      sensor1.stop();
      assert_true(verifyReading(sensor1, false));
      assert_true(verifyReading(sensor2));
      sensor2.stop();
      assert_true(verifyReading(sensor2, false));
    });
    sensor1.onerror = t.step_func_done(unreached);
    sensor2.onerror = t.step_func_done(unreached);
    sensor1.start();
    sensor2.start();
  }, "sensor reading is correct");

  async_test(t => {
    let sensor = new sensorType();
    let cachedTimeStamp1;
    sensor.onactivate = () => {
      cachedTimeStamp1 = sensor.timestamp;
    };
    sensor.onerror = t.step_func_done(unreached);
    sensor.start();
    t.step_timeout(() => {
      sensor.onchange = t.step_func_done(() => {
        //sensor.timestamp changes.
        let cachedTimeStamp2 = sensor.timestamp;
        assert_greater_than(cachedTimeStamp2, cachedTimeStamp1);
        sensor.stop();
      });
    }, 1000);
  }, "sensor timestamp is updated when time passes");

  async_test(t => {
    window.onmessage = t.step_func(e => {
      assert_equals(e.data, "SecurityError");
      t.done();
    });
  }, "throw a 'SecurityError' when firing sensor readings within iframes");

  async_test(t => {
    let sensor = new sensorType();
    sensor.onactivate = t.step_func(() => {
      assert_true(verifyReading(sensor));
      let cachedSensor1 = readingToArray(sensor);
      let win = window.open('', '_blank');
      t.step_timeout(() => {
        let cachedSensor2 = readingToArray(sensor);
        win.close();
        sensor.stop();
        assert_array_equals(cachedSensor1, cachedSensor2);
        t.done();
      }, 1000);
    });
    sensor.onerror = t.step_func_done(unreached);
    sensor.start();
  }, "sensor readings can not be fired on the background tab");

  test(() => {
    let sensor = new sensorType();
    sensor.onerror = unreached;
    assert_false(sensor.activated);
  }, "default sensor.state is 'idle' not 'activated'");

  test(() => {
    let sensor = new sensorType();
    sensor.onerror = unreached;
    sensor.start();
    assert_false(sensor.activated);
    sensor.stop();
  }, "sensor.state changes to 'activating' after sensor.start()");

  test(() => {
    let sensor, start_return;
    sensor = new sensorType();
    sensor.onerror = unreached;
    start_return = sensor.start();
    assert_equals(start_return, undefined);
    sensor.stop();
  }, "sensor.start() returns undefined");

  test(() => {
    try {
      let sensor = new sensorType();
      sensor.onerror = unreached;
      sensor.start();
      sensor.start();
      assert_false(sensor.activated);
      sensor.stop();
    } catch (e) {
       assert_unreached(e.name + ": " + e.message);
    }
  }, "no exception is thrown when calling start() on already started sensor");

  test(() => {
    let sensor = new sensorType();
    sensor.onerror = unreached;
    sensor.start();
    sensor.stop();
    assert_false(sensor.activated);
  }, "sensor.state changes to 'idle' after sensor.stop()");

  test(() => {
    let sensor, stop_return;
    sensor = new sensorType();
    sensor.onerror = unreached;
    sensor.start();
    stop_return = sensor.stop();
    assert_equals(stop_return, undefined);
  }, "sensor.stop() returns undefined");

  test(() => {
    try {
      let sensor = new sensorType();
      sensor.onerror = unreached;
      sensor.start();
      sensor.stop();
      sensor.stop();
      assert_false(sensor.activated);
    } catch (e) {
       assert_unreached(e.name + ": " + e.message);
    }
  }, "no exception is thrown when calling stop() on already stopped sensor");
}

function runGenericSensorInsecureContext(sensorType) {
  test(() => {
    assert_throws('SecurityError', () => { new sensorType(); });
  }, "throw a 'SecurityError' when construct sensor in an insecure context");
}

function runGenericSensorOnerror(sensorType) {
  async_test(t => {
    let sensor = new sensorType();
    sensor.onactivate = t.step_func_done(assert_unreached);
    sensor.onerror = t.step_func_done(event => {
      assert_false(sensor.activated);
      assert_equals(event.error.name, 'NotReadableError');
    });
    sensor.start();
  }, "'onerror' event is fired when sensor is not supported");
}

function runSensorFrequency(sensorType) {
  async_test(t => {
    let fastSensor = new sensorType({frequency: 30});
    let slowSensor = new sensorType({frequency: 9});
    let fastSensorNumber = 0;
    let slowSensorNumber = 0;
    fastSensor.onchange = () => {
      fastSensorNumber++;
    };
    slowSensor.onchange = t.step_func(() => {
      slowSensorNumber++;
      if (slowSensorNumber == 1) {
        fastSensor.start();
      } else if (slowSensorNumber == 2) {
        assert_equals(fastSensorNumber, 3);
        fastSensor.stop();
        slowSensor.stop();
        t.done();
      }
    });
    fastSensor.onerror = t.step_func_done(unreached);
    slowSensor.onerror = t.step_func_done(unreached);
    slowSensor.start();
  }, "Test that the frequency hint is correct");

  async_test(t => {
    let sensor = new sensorType({frequency: 600});
    let number = 0;
    sensor.onchange = () => {
      number++;
    };
    sensor.onerror = t.step_func_done(unreached);
    sensor.start();
    t.step_timeout(() => {
      assert_less_than_equal(number, 60);
      sensor.stop();
      t.done();
    }, 1000);
  }, "frequency is capped to 60.0 Hz");
}
