// =========================
// ARRAYS EN TYPESCRIPT
// =========================
const number: number[] = [1, 2, 3, 4, 5];
const otrosNumeros = [1, 2, 3, 4];
number.push(6);

const frutas: Array<string> = ["Manzana", "Pera", "Cambur"];
frutas.push("Durazno");

const mixto: (string | number)[] = ["Hola", 123, "Hola"];
const arrayToFilter: (string | undefined)[] = [
  "Sebastian",
  undefined,
  "Karina",
  undefined,
];

const arrayFiltrado: string[] = arrayToFilter.filter(
  (o) => typeof o === "string",
);
console.log(arrayFiltrado);
