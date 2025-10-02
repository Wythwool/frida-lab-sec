
function wrap(secName) {
  try {
    var p = Module.getExportByName('Security', secName);
    Interceptor.attach(p, { onEnter: function(args) { send({t:'ios.sec', api: secName}); } });
  } catch(e){}
}
wrap('SecItemCopyMatching'); wrap('SecItemAdd'); wrap('SecItemUpdate');
