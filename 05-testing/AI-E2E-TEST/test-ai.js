process.loadEnvFile();

import { test } from "node:test";
import assert from "assert";
import { localBrowser, Stagehand } from "@browserbasehq/stagehand";

test("Un usuario puede entrar a la pagina de entradas del Real madrid y adquirir 2 entradas por $160 cada una", async () => {
  const browser = await localBrowser.launch();

  const stagehand = await Stagehand.create({
    browser,
    model: {
      modelName: "google/gemini-3.6-flash",
      apiKey: process.env.GEMINI_API_KEY,
    },
  });

  const page = await browser.context.activePage();

  await page.goto(
    "https://www.footballticketnet.com/spanish-la-liga/atletico-madrid-vs-real-madrid-wanda-metropolitano-football-tickets/event/132096?source=es",
  );

  await stagehand.act(
    "Cierra la ventana modal que se abre que te pregunta cuantos tickets quieres",
  );

  await stagehand.act(
    "Click en el boton de comprar, abajo de la cantidad para comprar las entradas",
  );

  const { data } = await stagehand.extract("extract the total from the page");
  console.log("subtotal extraido", data.extraction);
  assert.strictEqual(data.extraction, "252.29");

  await stagehand.close();
  await browser.close();
});
