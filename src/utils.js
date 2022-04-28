function capitalizeFirebaseAuthError(message) {
  const words = message.split("-");
  words[0] = words[0].substring(words[0].indexOf("/") + 1);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export { capitalizeFirebaseAuthError };
