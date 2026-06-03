export type OpcionValue = 'panini' | 'messi' | 'cristiano' | 'mbappe';

export interface Opcion {
  id: number;          // 1=panini, 2=messi, 3=cristiano, 4=mbappe
  value: OpcionValue;
  label: string;
  sublabel: string;
  emoji: string;
  image: string;       // path en assets/
}

export const OPCIONES: Opcion[] = [
  {
    id: 1,
    value: 'panini',
    label: 'Carta Panini',
    sublabel: 'Tu tarjeta coleccionable',
    emoji: '🃏',
    image: 'panini.png',
  },
  {
    id: 2,
    value: 'messi',
    label: 'Foto con Messi',
    sublabel: 'Posa junto a la leyenda',
    emoji: '🐐',
    image: 'messi_gemini.jpg',
  },
  {
    id: 3,
    value: 'cristiano',
    label: 'Foto con CR7',
    sublabel: 'Comparte el encuadre con él',
    emoji: '👑',
    image: 'cristiano.png',
  },
  {
    id: 4,
    value: 'mbappe',
    label: 'Foto con Mbappé',
    sublabel: 'Aparece junto al crack francés',
    emoji: '⚡',
    image: 'mbappe.png',
  },
];
