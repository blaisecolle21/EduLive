const KEY_STORAGE_KEY = "cacheEncKey";

async function getOrCreateKey() {
  let rawKey = sessionStorage.getItem(KEY_STORAGE_KEY);
  let keyBytes;
  if (rawKey) {
    keyBytes = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0));
  } else {
    keyBytes = crypto.getRandomValues(new Uint8Array(32));
    sessionStorage.setItem(
      KEY_STORAGE_KEY,
      btoa(String.fromCharCode(...keyBytes)),
    );
  }
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptData(obj) {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(obj));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };
}

export async function decryptData(encrypted) {
  try {
    const key = await getOrCreateKey();
    const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(encrypted.data), (c) =>
      c.charCodeAt(0),
    );
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return JSON.parse(new TextDecoder().decode(plainBuffer));
  } catch (e) {
    console.warn(
      "Déchiffrement impossible (clé absente ou données corrompues)",
      e,
    );
    return null;
  }
}

export function clearCacheKey() {
  sessionStorage.removeItem(KEY_STORAGE_KEY);
}
