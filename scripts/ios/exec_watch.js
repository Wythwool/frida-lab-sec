
function hook(name) {
  try {
    var addr = Module.getExportByName(null, name);
    Interceptor.attach(addr, {
      onEnter: function(args) {
        var argv = [];
        if (name === 'execve') { argv.push(Memory.readUtf8String(args[0])); }
        else if (name === 'system') { argv.push(Memory.readUtf8String(args[0])); }
        send({t:'ios.exec', api:name, argv: argv});
      }
    });
  } catch(e) {}
}
hook('execve'); hook('system');
if (ObjC.available) {
  try {
    var UIApplication = ObjC.classes.UIApplication;
    if (UIApplication && UIApplication['- openURL:']) {
      Interceptor.attach(UIApplication['- openURL:'].implementation, {
        onEnter: function(args) {
          var url = new ObjC.Object(args[2]).toString();
          send({t:'ios.url', api:'UIApplication openURL', url: url});
        }
      });
    }
  } catch(e) {}
}
