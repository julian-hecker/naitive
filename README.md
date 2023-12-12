# Expo x LangChain

This repo is an attempt to integrate Langchain into an Expo React Native application.

## OpenAI Text-To-Speech

```js
const audio = document.createElement('audio');
audio.controls = true;
audio.style = 'position: fixed; top: 100px; right: 0; left: 0; width: 100%;';
audio.id = 'streaming';
audio.autoplay = true;
document.body.appendChild(audio);

const mediaSource = new MediaSource();
audio.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', sourceOpen);

async function sourceOpen() {
    const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg'); // Adjust MIME type as needed
    const rs = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + openAIApiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: 'What is up?!',
            model: 'tts-1',
            response_format: 'opus',
            voice: 'echo',
        }),
    }).then((res) => res.body);

    const reader = rs.getReader();

    reader.read().then(function process({ done, value }) {
        if (done) {
            if (mediaSource.readyState === 'open') mediaSource.endOfStream();
            return;
        }
        // If value is not in the right format, you need to transcode it here
        sourceBuffer.appendBuffer(value);

        sourceBuffer.addEventListener('updateend', () => {
            if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
                reader.read().then(process);
            }
        });
    });
}
```

## Debugging Findings

There are several critical modules which are globally present in Web or Node environments, but notably missing in React Native.

I am using [react-native-polyfill-globals](https://www.npmjs.com/package/react-native-polyfill-globals) to polyfill some of these missing modules, as explained below.

### ReadableStream Polyfill

Compilation fails without the ReadableStream polyfill.

### URL, Encoding, Crypto Polyfills

Calling the API fails without the URL Polyfill.

Running a chat request fails without Crypto & Encoding polyfills.

### Fetch Polyfill

When streaming data is requested from a server, it is returned on the fetch response.body as a ReadableStream.

By default, this is not supported in React Native's implementation of fetch.

It's also necessary to pass `reactNative: { textStreaming: true }` as a parameter to the fetch call.

Currently doing this by modifying the node_modules/openai/core.js line 233. Need to find a better way to do this since this won't work for other LLM's.

### Symbol.asyncIterator is not defined `object is not async iterable`

In Langchain, several modules make use of the [`for await...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) loop. This provides a friendly syntax to use Async Iterators like Streams and Generator Functions.

You can only pass iterables or async iterables into a `for await` loop, which means the object you are iterating over must have a `Symbol.iterator` property or `Symbol.asyncIterator` property. As of November 2023, `Symbol.asyncIterator` may not be defined in React Native by default, and should be polyfilled.

### TikToken `SyntaxError: Invalid RegExp: Invalid Escape`

In React Native's Hermes runtime, as you can tell, there are several JavaScript features which do not have full levels of support.

TikToken is used to count the tokens an LLM uses. When a response has finished streaming, LangChain counts the tokens using TikToken. However, TikToken uses a RegExp feature which is not supported, Unicode property escapes (`\p`). This causes a crash.

Solution is to patch LangChain to wrap the call with a try/catch. I have raised the [issue on the langchain-js repo here](https://github.com/langchain-ai/langchainjs/issues/3473)

```js
// https://www.npmjs.com/package/@azure/core-asynciterator-polyfill
if (typeof Symbol === undefined || !Symbol.asyncIterator) {
    Symbol.asyncIterator = Symbol.for('Symbol.asyncIterator');
}
```

## Todo

-   [x] Polyfill missing modules
-   [x] Patch OpenAI fetch to add the `reactNative: { textStreaming }` option.
-   [x] Patch langchain's call to TikToken
-   [x] Add conversations, local storage, etc
-   [x] Store API keys using device storage
    -   [ ] Store API keys securely
-   [x] Persist conversations locally
    -   [ ] Delete messages, manage convos
-   [ ] Allow users to customize and select a model
-   [ ] Stream Audio from TTS
-   [ ] Allow users to create conversations with custom settings (`session/new.tsx`)
-   [ ] Integrate LangChain memory, chains, vector, agents
-   [ ] Chain Builder

## Resources

-   MDN Docs
    -   [ReadableStream Async Iterator](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams#consuming_a_fetch_using_asynchronous_iteration)
-   NPM Packages
    -   [React Native Polyfills](https://www.npmjs.com/package/react-native-polyfill-globals) Polyfills for several missing modules in React Native
    -   [Async Iterator Polyfill](https://www.npmjs.com/package/@azure/core-asynciterator-polyfill) Polyfill for Symbol.asyncIterator
-   OpenAI Docs
    -   [Streaming Docs](https://platform.openai.com/docs/api-reference/streaming)
-   GitHub Repos
    -   [langchainjs](https://github.com/langchain-ai/langchainjs) LangChain TS library code
    -   [openai-node](https://github.com/openai/openai-node) OpenAI's API Client
        -   [streaming.ts](https://github.com/openai/openai-node/blob/master/src/streaming.ts) Streaming operations and such
-   Other
    -   [React Native Support for Async Iterator](https://github.com/facebook/metro/issues/551) Should be supported by `metro-react-native-babel-preset` which is used by `babel-preset-expo`.

## OpenAI Streaming

When you call the OpenAI API with `{ stream: true }` in the request body, the chunks are streamed back in the response body as a ReadableStream.

The code snippet below works in Node, but not browsers. Note the `for await`. ReadableStream is not considered async iterable in the browser.

```js
await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        Authorization: 'Bearer ' + openAIApiKey,
        'Content-Type': 'application/json',
    },
    body: `{ "model": "gpt-3.5-turbo", "messages": [{ "role": "system", "content": "You are an AI Assistant!" }, { "role": "user", "content": "What's up?" }], "stream": true }`,
}).then(async (res) => {
    for await (const chunk of res.body) {
        console.log(chunk);
    }
});
```

The below code works in Web/Browser environments.

```js
await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        Authorization: 'Bearer ' + openAIApiKey,
        'Content-Type': 'application/json',
    },
    body: `{ "model": "gpt-3.5-turbo", "messages": [{ "role": "system", "content": "You are an AI Assistant!" }, { "role": "user", "content": "What's up?" }], "stream": true }`,
})
    // converts the stream of uint8arrays to a stream of strings
    // not available in react native, and there is no polyfill
    .then((res) => res.body.pipeThrough(new TextDecoderStream()))
    // readablestream is not async iterable in all browsers
    .then(async (rs) => {
        const reader = rs.getReader();
        let content = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) return content;
            const lines = value
                // get newline separated chunks
                .split('\n')
                // keep lines with data // split on one or more newlines // .split(/\r?\n+/g)
                .filter((line) => line.length)
                // keep the data chunks
                .filter((line) => line.startsWith('data: '))
                // remove "data: "
                .map((line) => line.slice(6))
                // remove the ending indicator
                .filter((line) => !line.startsWith('[DONE]'))
                // JSON parse each chunk
                .map((line) => JSON.parse(line));
            // OpenAI has a weird response format
            const tokens = lines.map((line) => line?.choices?.[0]?.delta?.content ?? '');
            tokens.forEach((token) => {
                content += token;
                console.log(token);
            });
        }
    });
```

The below code works in React Native environments. Note the `reactNative: { textStreaming: true }` in the fetch options. This is a new property added by the fetch polyfill. Also note the `onChunk` method being called for each chunk in the new stream. The below code, however, still returns a uint8array.

```js
const onChunk = (chunk) => console.log(chunk);

await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        Authorization: 'Bearer ' + openAIApiKey,
        'Content-Type': 'application/json',
    },
    body: `{ "model": "gpt-3.5-turbo", "messages": [{ "role": "system", "content": "You are an AI Assistant!" }, { "role": "user", "content": "What's up?" }], "stream": true }`,
    // @ts-ignore polyfilling the native fetch adds this option
    reactNative: { textStreaming: true },
}).then((res) => {
    const reader = res.body.getReader();
    return new ReadableStream({
        async start(controller) {
            while (true) {
                const { done, value } = (await reader?.read()) ?? {};
                if (done || typeof value === 'undefined') break;
                onChunk(value);
                controller.enqueue(value);
            }
            controller.close();
            reader.releaseLock();
        },
    });
});
```

```ts
function handleReadableStream<R>(rs: ReadableStream<R>, onChunk: (chunk: R) => void) {
    const reader = rs.getReader();
    return new ReadableStream({
        async start(controller) {
            while (true) {
                const { done, value } = (await reader?.read()) ?? {};
                if (done || typeof value === 'undefined') break;
                onChunk(value);
                controller.enqueue(value);
            }
            controller.close();
            reader.releaseLock();
        },
    });
}
```
