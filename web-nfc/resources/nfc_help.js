'use strict';

const test_text_data = "Test text data.";
const test_text_byte_array = new TextEncoder('utf-8').encode(test_text_data);
const test_number_data = 42;
const test_json_data = {level: 1, score: 100, label: 'Game'};
const test_url_data = "https://w3c.github.io/web-nfc";
const test_buffer_data = new ArrayBuffer(test_text_byte_array.length);

function noop() {};

function createMessage(records) {
  if (records !== undefined) {
    let message = {};
    message.records = records;
    return message;
  }
}

function createRecord(recordType, mediaType, data) {
  let record = {};
  if (recordType !== undefined) {
    record.recordType = recordType;
  }
  if (mediaType !== undefined) {
    record.mediaType = mediaType;
  }
  if (data !== undefined) {
    record.data = data;
  }
  return record;
}

function createTextRecord(text) {
  return createRecord('text', 'text/plain', text);
}

function createJsonRecord(json) {
  return createRecord('json', 'application/json', json);
}

function createOpaqueRecord(buffer) {
  return createRecord('opaque', 'application/octet-stream', buffer);
}

function createUrlRecord(url) {
  return createRecord('url', 'text/plain', url);
}

function createEmptyRecord() {
  return createRecord('empty', '', null);
}

function assertWebNFCMessagesEqual(a, b) {
  assert_equals(a.url, b.url);
  assert_equals(a.records.length, b.records.length);
  for(let i in a.records) {
    let recordA = a.records[i];
    let recordB = b.records[i];
    assert_equals(recordA.recordType, recordB.recordType);
    assert_equals(recordA.mediaType, recordB.mediaType);
    if (recordA.data instanceof ArrayBuffer) {
      assert_array_equals(new Uint8Array(recordA.data),
          new Uint8Array(recordB.data));
    } else if (typeof recordA.data === 'object') {
      assert_object_equals(recordA.data, recordB.data);
    }
    if (typeof recordA.data === 'number'
        || typeof recordA.data === 'string') {
      assert_true(recordA.data == recordB.data);
    }
  }
}

function testNFCMessage(pushMessage, desc, watchOptions) {
  promise_test(t => {
    return navigator.nfc.push({records:[{data: pushMessage.data, recordType: pushMessage.recordType, mediaType: pushMessage.mediaType}]})
      .then(() => {
        return new Promise(resolve => {
          if (watchOptions !== null && watchOptions !== undefined) {
            navigator.nfc.watch((message) => resolve(message), watchOptions);
          } else {
            navigator.nfc.watch((message) => resolve(message));
          }
        }).then((message) => {
          for(let record of message.records) {
            assert_equals(record.recordType, pushMessage.recordType);
            assert_equals(record.mediaType, pushMessage.mediaType);
            switch (record.recordType) {
              case "empty":
                assert_equals(record.data, undefined);
                break;
              case "text":
              case "url":
                assert_equals(record.data, pushMessage.data);
                break;
              case "json":
                for (let prop in record.data) {
                  if (record.data[prop] instanceof Array) {
                    assert_array_equals(record.data[prop], pushMessage.data[prop]);
                  } else {
                    assert_equals(record.data[prop], pushMessage.data[prop]);
                  }
                }
                break;
              case "opaque":
                for (let i= 0; i<= record.data.byteLength; i++) {
                  assert_equals(record.data[i], pushMessage.data[i]);
                }
                break;
              default:
                assert_unreached("Invalid RecordType");
                break;
            }
          }
        });
      });
  }, desc);
}
