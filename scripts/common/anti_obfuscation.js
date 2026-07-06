if (Java.available) {
  Java.perform(function () {
    var matches = [];
    Java.enumerateLoadedClasses({
      onMatch: function (name) {
        var lower = name.toLowerCase();
        if (name.indexOf("$") < 0 && (lower.indexOf("crypto") >= 0 || lower.indexOf("exec") >= 0 || lower.indexOf("root") >= 0)) {
          matches.push(name);
        }
      },
      onComplete: function () {
        send({ platform: "android", category: "class-search", classes: matches });
      },
    });
  });
}

if (ObjC.available) {
  var out = [];
  for (var cls in ObjC.classes) {
    var lower = cls.toLowerCase();
    if (lower.indexOf("url") >= 0 || cls.indexOf("SecItem") >= 0 || lower.indexOf("crypto") >= 0) out.push(cls);
  }
  send({ platform: "ios", category: "class-search", classes: out });
}
