
Java.perform(function() {
  var Runtime = Java.use('java.lang.Runtime');
  var PB = Java.use('java.lang.ProcessBuilder');
  Runtime.exec.overload('[Ljava.lang.String;').implementation = function(cmd) {
    var arr = []; for (var i=0;i<cmd.length;i++) arr.push(cmd[i]);
    send({t:'android.exec', api:'Runtime.exec(String[])', cmd: arr});
    return this.exec(cmd);
  };
  Runtime.exec.overload('java.lang.String').implementation = function(s) {
    send({t:'android.exec', api:'Runtime.exec(String)', cmd: s});
    return this.exec(s);
  };
  PB.start.implementation = function() {
    var list = this.command().toArray(); var arr = [];
    for (var i=0;i<list.length;i++) arr.push(list[i].toString());
    send({t:'android.exec', api:'ProcessBuilder.start', cmd: arr});
    return this.start();
  };
});
