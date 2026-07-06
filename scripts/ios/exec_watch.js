function hook(name) {
  try {
    var addr = Module.getExportByName(null, name);
    Interceptor.attach(addr, {
      onEnter: function (args) {
        var command = [];
        if (name === "execve" || name === "system") command.push(Memory.readUtf8String(args[0]));
        send({ platform: "ios", category: "process", api: name, command: command });
      },
    });
  } catch (e) {
    send({ platform: "ios", category: "hook-skip", stage: name, message: String(e) });
  }
}

hook("execve");
hook("system");

if (ObjC.available) {
  try {
    var UIApplication = ObjC.classes.UIApplication;
    if (UIApplication && UIApplication["- openURL:"]) {
      Interceptor.attach(UIApplication["- openURL:"].implementation, {
        onEnter: function (args) {
          var url = new ObjC.Object(args[2]).toString();
          send({ platform: "ios", category: "url", api: "UIApplication.openURL", url: url });
        },
      });
    }
  } catch (e) {
    send({ platform: "ios", category: "hook-error", stage: "UIApplication.openURL", message: String(e) });
  }
}
