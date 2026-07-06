Java.perform(function () {
  try {
    var Call = Java.use("okhttp3.RealCall");
    Call.execute.implementation = function () {
      try {
        var request = this.request();
        send({
          platform: "android",
          category: "http",
          library: "okhttp3",
          method: request.method().toString(),
          url: request.url().toString(),
        });
      } catch (e) {
        send({ platform: "android", category: "hook-error", stage: "okhttp.inspect", message: String(e) });
      }
      return this.execute();
    };
  } catch (e) {
    send({ platform: "android", category: "hook-skip", stage: "okhttp.RealCall", message: String(e) });
  }
});
