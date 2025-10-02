
if (ObjC.available) {
  try {
    var NSURLSession = ObjC.classes.NSURLSession;
    if (NSURLSession && NSURLSession['- dataTaskWithRequest:completionHandler:']) {
      Interceptor.attach(NSURLSession['- dataTaskWithRequest:completionHandler:'].implementation, {
        onEnter: function(args) {
          var req = new ObjC.Object(args[2]);
          var url = req.URL().absoluteString().toString();
          var method = req.HTTPMethod() ? req.HTTPMethod().toString() : 'GET';
          send({t:'ios.http', method: method, url: url});
        }
      });
    }
    var WKPreferences = ObjC.classes.WKPreferences;
    if (WKPreferences && WKPreferences['- setJavaScriptEnabled:']) {
      Interceptor.attach(WKPreferences['- setJavaScriptEnabled:'].implementation, {
        onEnter: function(args) { send({t:'ios.web', setJsEnabled: !!(args[2].toInt32())}); }
      });
    }
  } catch(e){ send({t:'err', where:'ios.url', msg:e.toString()}); }
}
