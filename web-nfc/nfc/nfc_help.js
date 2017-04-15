/**
Copyright (c) 2017 Intel Corporation.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of works must retain the original copyright notice, this list
  of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the original copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.
* Neither the name of Intel Corporation nor the names of its contributors
  may be used to endorse or promote products derived from this work without
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY INTEL CORPORATION "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL INTEL CORPORATION BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/
'use strict';
const test_text_data = "Test text data.";
const test_text_byte_array = new TextEncoder('utf-8').encode(test_text_data);
const test_number_data = 42;
const test_json_data = {level: 1, score: 100, label: 'Game'};
const test_url_data = "https://w3c.github.io/web-nfc";
const test_message_origin = "https://127.0.0.1:8443";
const test_buffer_data = new ArrayBuffer(test_text_byte_array.length);
const test_buffer_view = new Uint8Array(test_buffer_data).set(test_text_byte_array);

function noop() {};

function toNFCWatchMode(mode) {
  if (mode === 'web-nfc-only') {
    return nfc.NFCWatchMode.WEBNFC_ONLY;
  }
  return nfc.NFCWatchMode.ANY;
}
function toNFCRecordType(type) {
  switch (type) {
    case 'text':
      return nfc.NFCRecordType.TEXT;
    case 'url':
      return nfc.NFCRecordType.URL;
    case 'json':
      return nfc.NFCRecordType.JSON;
    case 'opaque':
      return nfc.NFCRecordType.OPAQUE_RECORD;
  }
  return nfc.NFCRecordType.EMPTY;
}

function createNFCWatchOptions(url, recordType, mediaType, mode) {
  return {url, recordType, mediaType, mode}
}
function assertNFCWatchOptionsEqual(provided, received) {
  if (provided.url !== undefined) {
    assert_equals(provided.url, received.url);
  }else{
    assert_equals(received.url, '');
  }
  if (provided.mediaType !== undefined) {
    assert.equals(provided.mediaType, received.media_type);
  }else{
    assert.equals(received.media_type, '');
  }
  if (provided.mode !== undefined) {
    assert_equals(toNFCWatchMode(provided.mode), received.mode);
  }else{
    assert_equals(received.mode, nfc.NFCWatchMode.WEBNFC_ONLY);
  }
  if (provided.recordType !== undefined) {
    assert_equals(!+recevied.record_filter, true);
    assert_equals(toNFCRecordType(provided.recordType), recevied.record_filter.record_type);
  }
}

function assertNFCPushOptionsEqual(provided, received) {
  if (provided.ignoreRead !== undefined) {
    assert_equals(provided.ignoreRead, !!+received.ignore_read);
  }else{
    assert_equals(!!+received.ignore_read, true);
  }
  if (provided.timeout !== undefined) {
    assert_equals(provided.timeout, received.timeout);
  }else{
    assert_equals(received.timeout, Infinity);
  }
  if (provided.target !== undefined) {
    assert_equals(toMojoNFCPushTarget(provided.target), received.target);
  }else{
    assert_equals(received.target, nfc.NFCPushTarget.ANY);
  }
}

function createMessage(records) {
  if (records !== undefined) {
    let message = {};
    message.data = records;
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
  return createRecord("url", "text/plain", url);
}
