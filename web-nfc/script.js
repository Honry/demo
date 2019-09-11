if (!NFCReader) {
  pre.textContent += `Error: ${error}\n`;
}

const r = new NFCReader();

r.onerror = event => {
  pre.textContent += "Error: " + event.error + "\n";
};

const onReading = ({ message }) => {
  pre.textContent += `> Reading from ${event.serialNumber}\n`;
  pre.textContent += `> URL: ${message.url}\n`;
  pre.textContent += `> Records:\n`;

  if (message.records.length === 0) {
    pre.textContent += `  > No WebNFC records\n`;
    return;
  }

  for (const record of message.records) {
    switch (record.recordType) {
      case "empty":
        pre.textContent += `  > Empty record\n`;
        break;
      case "text":
        pre.textContent += `  > Text: ${record.toText()}\n`;
        break;
      case "url":
        pre.textContent += `  > URL: ${record.toText()}\n`;
        break;
      case "json":
        pre.textContent += `  > JSON: ${JSON.stringify(record.toJSON())}\n`;
        break;
      case "opaque":
        if (record.mediaType.startsWith("image/")) {
          const blob = new Blob([record.toArrayBuffer()], {type: record.mediaType});

          const img = document.createElement("img");
          img.src = URL.createObjectURL(blob);
          img.onload = () => window.URL.revokeObjectURL(this.src);

          document.body.appendChild(img);
        } else {


        }
        break;
    }
  }
};

const onReadingInputChange = _ => {
  r.onreading = readingInput.checked ? onReading : null;
}

readingInput.onchange = onReadingInputChange;
onReadingInputChange();

/* Scan signal */
const abortController = new AbortController();
abortController.signal.addEventListener("abort", _ => {
  pre.textContent += "> Aborted scan\n";
});
pre.textContent += `Reading need scan...\n`;

abortButton.addEventListener("click", _ => {
  abortController.abort();
});

scanButton.addEventListener("click", _ => {
  if (recordType.value === "---") {
    r.scan({
      signal: abortController.signal,
      id: scanId.value,
      mediaType: mediaType.value
    });
  } else {
    r.scan({
      signal: abortController.signal,
      id: scanId.value,
      recordType: recordType.value,
      mediaType: mediaType.value
    });
  }
});

/* Push signal */
const abortPushController = new AbortController();
abortPushController.signal.addEventListener("abort", _ => {
  pre.textContent += "> Aborted push\n";
});

abortPushButton.addEventListener("click", _ => {
  abortPushController.abort();
});

/* Push Message */
pushMessage.value = '{ "records": [{ "recordType": "text", "data": "hello", \
    "mediaType": "text/plain", "id": "1" }] }';
const opaque_data = new ArrayBuffer(15);
pushRecordType.onchange = () => {
  pushMessage.disabled = false;
  switch (pushRecordType.value) {
    case "empty":
      pushMessage.value = '{ "records": [{ "recordType": "empty" }] }';
      break;
    case "text":
      pushMessage.value = '{ "records": [{ "recordType": "text", \
          "data": "hello", "mediaType": "text/plain", "id": "1" }] }';
      break;
    case "url":
      pushMessage.value = '{ "records": [{ "recordType": "url", "data": \
           "http://www.intel.com", "mediaType": "text/plain", "id": "1" }] }';
      break;
    case "json":
      pushMessage.value = '{ "records": [{ "recordType": "json", \
          "data": { "key1": "value1", "key2": "value2" }, \
          "mediaType": "application/json", "id": "1" }] }';
      break;
    case "opaque":
      pushMessage.value = '{ "records": [{ "recordType": "opaque", \
          "data": [object ArrayBuffer], "mediaType": "application/octet-stream"\
          , "id": "1" }] }';
      pushMessage.disabled = true;
      break;
  }
}

/* Write */

const test_text_data = 'Test text data.';
const test_text_byte_array = new TextEncoder('utf-8').encode(test_text_data);
const test_buffer_data = new ArrayBuffer(test_text_byte_array.length);
const test_buffer_view =
    new Uint8Array(test_buffer_data).set(test_text_byte_array);
writeButton.addEventListener("click", async _ => {
  pre.textContent += "Writing...\n";
  const w = new NFCWriter();
  let newMessage = null;
  if (pushRecordType.value ===  "opaque") {
    newMessage = { records: [{ recordType: "opaque", data: test_buffer_data,
        mediaType: "application/octet-stream", id: "1" }] };
  } else {
    newMessage = JSON.parse(pushMessage.value);
  }
  try {
    await w.push(
      newMessage,
      {
        target: target.value,
        timeout: timeout.value === "Infinity" ? "Infinity" : parseFloat(timeout.value),
        ignoreRead: ignoreRead.value === "false" ? false : true,
        signal: abortPushController.signal
      }
    );
    pre.textContent += "> Written\n";
  } catch(e) {
    pre.textContent += `> ${e}\n`;
  }
});

