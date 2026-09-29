import { Header, Footer } from "./Components/header&footer";
import "./index.css";
import { HomePage } from "./pages/Home";
import { SearchPage } from "./pages/Search";
import { Route } from "./Components/Route";

function App() {
  return (
    <>
      <Header />
      <Route path="/" componente={HomePage} />
      <Route path="/search" componente={SearchPage} />
      <Footer />
    </>
  );
}

export default App;
