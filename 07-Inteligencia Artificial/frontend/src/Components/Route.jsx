import { useRouter } from "../hooks/useRouter";

export function Route({ path, componente: Componente }) {
  const { currentPath } = useRouter();

  if (currentPath !== path) {
    return null;
  }

  return <Componente />;
}
