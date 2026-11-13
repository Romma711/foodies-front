/** Minúsculas y sin tildes, para que "cafe" encuentre "Café" y "PARRI" encuentre "La Parrilla". */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim();
}

/** Un término vacío coincide con todo: la búsqueda no está activa. */
export function coincideNombre(nombre: string, termino: string): boolean {
  const buscado = normalizarBusqueda(termino);
  return buscado === '' || normalizarBusqueda(nombre).includes(buscado);
}
