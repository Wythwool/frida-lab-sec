Java.perform(function () {
  try {
    var KeyStore = Java.use("java.security.KeyStore");
    KeyStore.getInstance.overload("java.lang.String").implementation = function (type) {
      var result = this.getInstance(type);
      send({ platform: "android", category: "keystore", api: "KeyStore.getInstance", type: type.toString() });
      return result;
    };
    KeyStore.getKey.overload("java.lang.String", "[C").implementation = function (alias, password) {
      send({ platform: "android", category: "keystore", api: "KeyStore.getKey", alias: alias });
      return this.getKey(alias, password);
    };

    var Cipher = Java.use("javax.crypto.Cipher");
    Cipher.init.overload("int", "java.security.Key").implementation = function (mode, key) {
      send({ platform: "android", category: "crypto", api: "Cipher.init", mode: mode, algorithm: this.getAlgorithm() });
      return this.init(mode, key);
    };
  } catch (e) {
    send({ platform: "android", category: "hook-skip", stage: "android.keystore", message: String(e) });
  }
});
