const jobsListingSection = document.querySelector(".jobs-listings");

jobsListingSection.addEventListener("click", (e) => {
  const element = e.target;

  if (element.classList.contains("btn-aplicar")) {
    let valorBoton = element.value;
    let valorBooleanoBoton = valorBoton === "true";
    element.value = !valorBooleanoBoton;

    if (element.value === "true") {
      element.textContent = "Aplicado";
      element.classList.toggle("btn-activo");
    } else {
      element.classList.remove("btn-activo");
      element.textContent = "Aplicar";
    }
  }
});

// const botones = document.querySelectorAll(".btn-aplicar");

// botones.forEach((boton) => {
//   boton.addEventListener("click", () => {
//     let valorBoton = boton.value;
//     console.log(valorBoton);
//     let valorBooleanoBoton = valorBoton === "true";
//     console.log(valorBooleanoBoton);
//     boton.value = !valorBooleanoBoton;
//     console.log(boton.value);

//     if (boton.value === "true") {
//       boton.textContent = "Aplicado";
//       boton.disabled = true;
//     } else boton.textContent = "Aplicar";
//   });
// });
