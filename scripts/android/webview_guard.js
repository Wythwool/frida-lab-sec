Java.perform(function () {
  try {
    var WebView = Java.use("android.webkit.WebView");
    WebView.getSettings.implementation = function () {
      var settings = this.getSettings();
      try {
        if (settings.getJavaScriptEnabled()) {
          send({ platform: "android", category: "webview", api: "getSettings", javascriptEnabled: true });
        }
      } catch (e) {
        send({ platform: "android", category: "hook-error", stage: "WebView.getSettings", message: String(e) });
      }
      return settings;
    };

    WebView.addJavascriptInterface.overload("java.lang.Object", "java.lang.String").implementation = function (object, name) {
      send({ platform: "android", category: "webview", api: "addJavascriptInterface", name: name.toString() });
      return this.addJavascriptInterface(object, name);
    };

    var URL = Java.use("java.net.URL");
    URL.openConnection.implementation = function () {
      var result = this.openConnection();
      send({ platform: "android", category: "network", api: "URL.openConnection", url: this.toString() });
      return result;
    };
  } catch (e) {
    send({ platform: "android", category: "hook-skip", stage: "android.webview", message: String(e) });
  }
});
