
if (Java.available) {
  Java.perform(function(){
    var res = [];
    Java.enumerateLoadedClasses({
      onMatch: function(c){ if (c.indexOf('$')<0 && (c.toLowerCase().indexOf('crypto')>=0 || c.toLowerCase().indexOf('exec')>=0)) res.push(c); },
      onComplete: function(){ send({t:'android.find', classes: res}); }
    });
  });
}
if (ObjC.available) {
  var out = [];
  for (var cls in ObjC.classes) {
    if (cls.toLowerCase().indexOf('url')>=0 || cls.indexOf('SecItem')>=0) out.push(cls);
  }
  send({t:'ios.find', classes: out});
}
