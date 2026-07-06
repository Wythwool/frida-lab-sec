if (ObjC.available) {
  try {
    var NSURLSession = ObjC.classes.NSURLSession;
    if (NSURLSession && NSURLSession["- dataTaskWithRequest:completionHandler:"]) {
      Interceptor.attach(NSURLSession["- dataTaskWithRequest:completionHandler:"].implementation, {
        onEnter: function (args) {
          var request = new ObjC.Object(args[2]);
          var url = request.URL().absoluteString().toString();
          var method = request.HTTPMethod() ? request.HTTPMethod().toString() : "GET";
          send({ platform: "ios", category: "http", api: "NSURLSession.dataTaskWithRequest", method: method, url: url });
        },
      });
    }

    var WKPreferences = ObjC.classes.WKPreferences;
    if (WKPreferences && WKPreferences["- setJavaScriptEnabled:"]) {
      Interceptor.attach(WKPreferences["- setJavaScriptEnabled:"].implementation, {
        onEnter: function (args) {
          send({ platform: "ios", category: "webview", api: "WKPreferences.setJavaScriptEnabled", enabled: !!args[2].toInt32() });
        },
      });
    }
  } catch (e) {
    send({ platform: "ios", category: "hook-error", stage: "ios.url_loading", message: String(e) });
  }
}
