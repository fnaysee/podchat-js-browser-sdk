import {Store} from "./store";
import {SDKParams} from "./sdkParams";
import ChatEvents from "../events.module";
import RequestBlocker from "./requestBlocker";
import ErrorHandler from "./errorHandler";

function App(){

    const app = {};

    app.store = new Store(app);
    app.sdkParams = new SDKParams();
    app.chatEvents = new ChatEvents(app);
    app.requestBlocker = new RequestBlocker(app);
    app.errorHandler = new ErrorHandler(app);

    return app;
}

export default App;