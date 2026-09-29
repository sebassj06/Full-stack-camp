// =========================
// ANY
// =========================

let cualquierCosa: any = "hola";
cualquierCosa = 42;
cualquierCosa = true;

const result = cualquierCosa + 8;

// Dos veces donde si usar any
// 1. En migraciones de JS a TS
// 2. En librerias de terceros sin tipos

// =========================
// UNKNOWN - Mas segura que any
// =========================

let valorDesconocido: unknown = "Hola";
valorDesconocido = 52;
valorDesconocido = true;
valorDesconocido = {
  name: "test",
};

// type narrowing
if (typeof valorDesconocido === "number") {
  const resultadoSeguro = valorDesconocido + 10;
  console.log(resultadoSeguro);
} else if (typeof valorDesconocido === "string") {
  console.log(valorDesconocido.toUpperCase());
}

// =========================
// Void - Funciones que no retornan nada
// =========================

function saludar(): void {
  console.log("Hola");
}

function logError(errorMessage: string): void {
  if (errorMessage.length === 0) {
    return;
  }

  console.log(errorMessage);
}

// =========================
// Never - El tipo imposible
// =========================

function bucleInfinito(): never {
  while (true) {
    // ...
  }
}

function throwErrror(message: string): never {
  throw new Error(message);
}

function revisarValor(x: number | string) {
  if (typeof x === "number") {
    console.log("Es un número:", x);
  } else if (typeof x === "string") {
    console.log("Es una cadena:", x);
  } else {
    // Aquí, x es de tipo 'never'
    throwErrror("Tipo no soportado");
  }
}

/*
┌──────────┬────────────────────────────────────────────────────────┐
│ Tipo     │ Descripción                                            │
├──────────┼────────────────────────────────────────────────────────┤
│ any      │ Acepta todo, permite todo. EVITAR.                     │
│ unknown  │ Acepta todo, pero requiere verificación. PREFERIBLE.   │
│ void     │ Para funciones que no retornan valor útil.             │
│ never    │ Para casos imposibles o funciones que no terminan.     │
└──────────┴────────────────────────────────────────────────────────┘
*/
