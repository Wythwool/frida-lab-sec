
Java.perform(function() {
  try {
    var KS = Java.use('java.security.KeyStore');
    KS.getInstance.overload('java.lang.String').implementation = function(typ) {
      var r = this.getInstance(typ);
      send({t:'android.ks', api:'KeyStore.getInstance', type: typ.toString()});
      return r;
    };
    KS.getKey.overload('java.lang.String','[C').implementation = function(alias, pwd) {
      send({t:'android.ks', api:'KeyStore.getKey', alias: alias});
      return this.getKey(alias, pwd);
    };
    var Cipher = Java.use('javax.crypto.Cipher');
    Cipher.init.overload('int', 'java.security.Key').implementation = function(mode, key) {
      send({t:'android.crypto', api:'Cipher.init', mode: mode, alg: this.getAlgorithm()});
      return this.init(mode, key);
    };
  } catch(e) { send({t:'err', where:'android.keystore', msg: e.toString()}); }
});
