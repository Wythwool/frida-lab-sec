function wrap(secName) {
  try {
    var pointer = Module.getExportByName("Security", secName);
    Interceptor.attach(pointer, {
      onEnter: function () {
        send({ platform: "ios", category: "keychain", api: secName });
      },
    });
  } catch (e) {
    send({ platform: "ios", category: "hook-skip", stage: secName, message: String(e) });
  }
}

wrap("SecItemCopyMatching");
wrap("SecItemAdd");
wrap("SecItemUpdate");
