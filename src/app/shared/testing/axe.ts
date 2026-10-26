import axe from 'axe-core';

/**
 * Runs axe-core on a rendered element and returns one readable line per violation, so a failing
 * test prints what broke and where. An empty array means the markup passes.
 *
 * Two rules are off because jsdom cannot evaluate them: `color-contrast` needs real layout and
 * computed colors (contrast is checked against the design tokens separately), and `region` expects
 * a full page with landmarks while these tests render components in isolation.
 */
export async function violacionesAxe(elemento: Element): Promise<string[]> {
  const resultado = await axe.run(elemento, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
  return resultado.violations.map(
    (violacion) =>
      `${violacion.id}: ${violacion.help} → ${violacion.nodes
        .map((nodo) => nodo.target.join(' '))
        .join(', ')}`,
  );
}
