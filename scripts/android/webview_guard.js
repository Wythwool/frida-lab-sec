
Java.perform(function() {
  try {
    var WebView = Java.use('android.webkit.WebView');
    WebView.getSettings.implementation = function() {
      var s = this.getSettings();
      try { var en = s.getJavaScriptEnabled(); if (en) send({t:'android.webview', jsEnabled: true}); } catch(e){}
      return s;
    };
    WebView.addJavascriptInterface.overload('java.lang.Object','java.lang.String').implementation = function(o, n) {
      send({t:'android.webview', addJSInterface: n.toString()});
      return this.addJavascriptInterface(o, n);
    };
    var URL = Java.use('java.net.URL');
    URL.openConnection.implementation = function() {
      var r = this.openConnection();
      try { var u = this.toString(); send({t:'android.net', url: u}); } catch(e){}
      return r;
    };
  } catch(e) { send({t:'err', where:'android.webview', msg: e.toString()}); }
});
