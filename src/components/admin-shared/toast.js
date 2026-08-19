let listeners = [];
let idCounter = 0;

export function showToast(message, type = "success", duration = 3500) {
  const id = ++idCounter;
  const toast = { id, message, type, duration };
  listeners.forEach((fn) => fn((prev) => [...prev, toast]));
  return id;
}

export function subscribeToast(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
