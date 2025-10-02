
Java.perform(function() {
  try {
    var Call = Java.use('okhttp3.RealCall');
    Call.execute.implementation = function() {
      try {
        var req = this.request();
        var url = req.url().toString();
        var m = req.method().toString();
        send({t:'android.http', lib:'okhttp3', method:m, url:url});
      } catch(e){}
      return this.execute();
    };
  } catch(e) { }
});
