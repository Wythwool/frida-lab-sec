Java.perform(function () {
  function event(api, command) {
    send({ platform: "android", category: "process", api: api, command: command });
  }

  var Runtime = Java.use("java.lang.Runtime");
  var ProcessBuilder = Java.use("java.lang.ProcessBuilder");

  Runtime.exec.overload("[Ljava.lang.String;").implementation = function (command) {
    var out = [];
    for (var i = 0; i < command.length; i++) out.push(command[i]);
    event("Runtime.exec(String[])", out);
    return this.exec(command);
  };

  Runtime.exec.overload("java.lang.String").implementation = function (command) {
    event("Runtime.exec(String)", command);
    return this.exec(command);
  };

  ProcessBuilder.start.implementation = function () {
    var list = this.command().toArray();
    var out = [];
    for (var i = 0; i < list.length; i++) out.push(list[i].toString());
    event("ProcessBuilder.start", out);
    return this.start();
  };
});
