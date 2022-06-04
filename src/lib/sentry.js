import * as Sentry from "@sentry/browser";

function initSentry(SDKParams) {
    Sentry.init({
        dsn: 'https://784a14966f6a416b8b58a4b144aef0f5:733b76b6354f4547a7428bb8c7489bf2@talksentry.sakku-khatam.ir/4',
        attachStacktrace: true
    });
    Sentry.setContext("Chat Params", SDKParams);
    Sentry.setTag("sdk.details", "js browser");
    Sentry.setTag("client.name", SDKParams.clientName);

}
export {initSentry}
export default Sentry;
