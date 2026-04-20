/* Datos de temas, niveles, teclas y retos */

window.MathMentorData = (() => {
  const features = [
    { icon: '📖', text: 'Paso a paso' },
    { icon: '🎯', text: 'Desafíos' },
    { icon: '💡', text: 'Conceptos clave' },
    { icon: '🎮', text: 'Para 10-15 años' },
  ];

  const ageRanges = [
    { value: '10-11', label: '10-11 años' },
    { value: '12-13', label: '12-13 años' },
    { value: '14-15', label: '14-15 años' },
  ];

  const topicsConfig = {
    arithmetic: {
      id: 'arithmetic',
      name: 'Aritmética',
      icon: '🔢',
      hint: 'Suma, resta, multiplicación y división con números enteros o decimales.',
      placeholder: '125 + 347 × 2',
      examples: ['24 + 58', '345 - 178', '12 × 15', '144 ÷ 12', '3 + 5 × 2'],
    },
    fractions: {
      id: 'fractions',
      name: 'Fracciones',
      icon: '🍕',
      hint: 'Operaciones con fracciones: usa "/" solo dentro de la fracción y "÷" para dividir.',
      placeholder: '1/2 + 3/4',
      examples: ['1/2 + 1/3', '3/4 - 1/2', '2/3 × 3/5', '5/6 ÷ 2/3'],
    },
    algebra: {
      id: 'algebra',
      name: 'Álgebra',
      icon: '🔤',
      hint: 'Ecuaciones simples con una variable. Usa "x" como incógnita.',
      placeholder: '2x + 5 = 15',
      examples: ['x + 7 = 12', '2x = 18', '3x + 4 = 19', '5x - 3 = 22'],
    },
    percentages: {
      id: 'percentages',
      name: 'Porcentajes',
      icon: '📊',
      hint: 'Calcula porcentajes. Escribe "% de" para calcular.',
      placeholder: '25% de 200',
      examples: ['10% de 50', '25% de 200', '15% de 80', '50% de 340'],
    },
    powers: {
      id: 'powers',
      name: 'Potencias',
      icon: '⚡',
      hint: 'Usa "^" para indicar la potencia. Ej: 2^3 = 2×2×2',
      placeholder: '5^3',
      examples: ['2^4', '3^3', '10^2', '5^3', '7^2'],
    },
    roots: {
      id: 'roots',
      name: 'Raíces',
      icon: '🌱',
      hint: 'Escribe "raiz(n)" o "sqrt(n)" para calcular la raíz cuadrada.',
      placeholder: 'raiz(144)',
      examples: ['raiz(25)', 'raiz(81)', 'raiz(144)', 'sqrt(64)'],
    },
  };

  const calculatorKeys = [
    ['7', '8', '9', '+'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '×'],
    ['0', '.', '÷', '='],
    ['%', 'de', '^', '√'],
    ['x', '(', ')', '⌫'],
  ];

  const quickChallenges = {
    arithmetic: [
      { question: '¿Cuánto es 15 × 4 + 10?', answer: '70' },
      { question: '¿Cuánto es 100 - 37 × 2?', answer: '26' },
      { question: '¿Cuánto es 8 × 9?', answer: '72' },
      { question: '¿Cuánto es 144 ÷ 12?', answer: '12' },
      { question: '¿Cuánto es 25 + 75 - 30?', answer: '70' },
    ],
    fractions: [
      { question: '¿Cuánto es 1/4 + 1/4?', answer: '1/2' },
      { question: '¿Cuánto es 2/3 + 1/6?', answer: '5/6' },
      { question: '¿Cuánto es 3/4 - 1/4?', answer: '1/2' },
      { question: 'Si como 1/3 de una pizza y luego 1/3 más, ¿cuánto comí?', answer: '2/3' },
    ],
    algebra: [
      { question: 'Si x + 3 = 10, ¿cuánto vale x?', answer: '7' },
      { question: 'Si 2x = 14, ¿cuánto vale x?', answer: '7' },
      { question: 'Si x - 5 = 8, ¿cuánto vale x?', answer: '13' },
      { question: 'Si 3x + 1 = 10, ¿cuánto vale x?', answer: '3' },
    ],
    percentages: [
      { question: '¿Cuánto es el 50% de 80?', answer: '40' },
      { question: '¿Cuánto es el 10% de 150?', answer: '15' },
      { question: 'Si un juego cuesta $100 y tiene 20% de descuento, ¿cuánto pagas?', answer: '80' },
      { question: '¿Cuánto es el 25% de 40?', answer: '10' },
    ],
    powers: [
      { question: '¿Cuánto es 3²?', answer: '9' },
      { question: '¿Cuánto es 2⁵?', answer: '32' },
      { question: '¿Cuánto es 10³?', answer: '1000' },
      { question: '¿Cuánto es 4²?', answer: '16' },
    ],
    roots: [
      { question: '¿Cuánto es √49?', answer: '7' },
      { question: '¿Cuánto es √100?', answer: '10' },
      { question: '¿Cuánto es √36?', answer: '6' },
      { question: 'Si √x = 8, ¿cuánto vale x?', answer: '64' },
    ],
  };

  const challengeSets = {
    arithmetic: [
      {
        question: '¿Cuánto es 18 + 7?',
        answer: '25',
        feedbackCorrect: 'Correcto: solo juntaste 18 y 7.',
        feedbackWrong: 'Revisa la suma básica: empieza en 18 y cuenta 7 más.',
      },
      {
        question: '¿Cuánto es 6 × 4?',
        answer: '24',
        feedbackCorrect: 'Bien: 6 × 4 es lo mismo que 6 + 6 + 6 + 6.',
        feedbackWrong: 'Te faltó recordar la tabla: 6 × 4 significa cuatro grupos de 6.',
      },
      {
        question: '¿Cuánto es 12 + 3 × 5?',
        answer: '27',
        feedbackCorrect: 'Muy bien: primero va 3 × 5 = 15, luego 12 + 15 = 27.',
        feedbackWrong: 'Te faltó aplicar jerarquía de operaciones: primero multiplicación, después suma.',
      },
      {
        question: '¿Cuánto es 40 - 24 ÷ 3?',
        answer: '32',
        feedbackCorrect: 'Exacto: primero 24 ÷ 3 = 8, luego 40 - 8 = 32.',
        feedbackWrong: 'Ojo con la jerarquía: divide antes de restar.',
      },
    ],
    fractions: [
      {
        question: '¿Cuánto es 1/4 + 1/4?',
        answer: '1/2',
        feedbackCorrect: 'Correcto: 1 parte + 1 parte = 2/4, y 2/4 se simplifica a 1/2.',
        feedbackWrong: 'Suma los numeradores y conserva el denominador: 1/4 + 1/4 = 2/4.',
      },
      {
        question: '¿Cuánto es 2/5 + 1/5?',
        answer: '3/5',
        feedbackCorrect: 'Bien: como tienen el mismo denominador, solo sumas numeradores.',
        feedbackWrong: 'Si el denominador es igual, se queda igual; suma solo los numeradores.',
      },
      {
        question: '¿Cuánto es 1/2 + 1/4?',
        answer: '3/4',
        feedbackCorrect: 'Muy bien: convertiste 1/2 en 2/4 y luego 2/4 + 1/4 = 3/4.',
        feedbackWrong: 'Necesitas denominador común: 1/2 es lo mismo que 2/4.',
      },
      {
        question: '¿Cuánto es 2/3 × 3/4?',
        answer: '1/2',
        feedbackCorrect: 'Exacto: el numerador es 2×3 = 6 y el denominador es 3×4 = 12; 6/12 se simplifica a 1/2.',
        feedbackWrong: 'En multiplicación de fracciones, multiplica arriba con arriba y abajo con abajo.',
      },
    ],
    algebra: [
      {
        question: 'Si x + 4 = 10, ¿cuánto vale x?',
        answer: '6',
        feedbackCorrect: 'Correcto: quitaste 4 de ambos lados, así que x = 6.',
        feedbackWrong: 'Para dejar x sola, resta 4 a ambos lados.',
      },
      {
        question: 'Si 2x = 18, ¿cuánto vale x?',
        answer: '9',
        feedbackCorrect: 'Bien: 2x significa 2 por x, así que divides entre 2.',
        feedbackWrong: 'Te faltó deshacer la multiplicación: divide 18 entre 2.',
      },
      {
        question: 'Si 3x + 2 = 14, ¿cuánto vale x?',
        answer: '4',
        feedbackCorrect: 'Muy bien: primero 14 - 2 = 12, luego 12 ÷ 3 = 4.',
        feedbackWrong: 'Primero quita el +2 y luego divide entre 3.',
      },
      {
        question: 'Si 5x - 5 = 20, ¿cuánto vale x?',
        answer: '5',
        feedbackCorrect: 'Exacto: sumas 5 a ambos lados y después divides entre 5.',
        feedbackWrong: 'Primero deshaz el -5 sumando 5, luego divide entre 5.',
      },
    ],
    percentages: [
      {
        question: '¿Cuánto es el 10% de 80?',
        answer: '8',
        feedbackCorrect: 'Correcto: 10% es una décima parte, y 80 ÷ 10 = 8.',
        feedbackWrong: '10% significa dividir entre 10.',
      },
      {
        question: '¿Cuánto es el 50% de 90?',
        answer: '45',
        feedbackCorrect: 'Bien: 50% es la mitad, y la mitad de 90 es 45.',
        feedbackWrong: '50% significa la mitad del número.',
      },
      {
        question: '¿Cuánto es el 25% de 120?',
        answer: '30',
        feedbackCorrect: 'Muy bien: 25% es un cuarto, y 120 ÷ 4 = 30.',
        feedbackWrong: '25% equivale a 1/4; divide el total entre 4.',
      },
      {
        question: '¿Cuánto es el 15% de 200?',
        answer: '30',
        feedbackCorrect: 'Exacto: 15% = 0.15, y 0.15 × 200 = 30.',
        feedbackWrong: 'Convierte 15% a 0.15 y multiplícalo por 200.',
      },
    ],
    powers: [
      {
        question: '¿Cuánto es 3²?',
        answer: '9',
        feedbackCorrect: 'Correcto: 3² significa 3 × 3.',
        feedbackWrong: 'El exponente 2 significa multiplicar la base por sí misma.',
      },
      {
        question: '¿Cuánto es 2³?',
        answer: '8',
        feedbackCorrect: 'Bien: 2 × 2 × 2 = 8.',
        feedbackWrong: 'No es 2 × 3; es 2 multiplicado 3 veces.',
      },
      {
        question: '¿Cuánto es 5² + 4?',
        answer: '29',
        feedbackCorrect: 'Muy bien: primero 5² = 25, luego 25 + 4 = 29.',
        feedbackWrong: 'Primero resuelve la potencia y después suma.',
      },
      {
        question: '¿Cuánto es 2⁴ + 3²?',
        answer: '25',
        feedbackCorrect: 'Exacto: 2⁴ = 16 y 3² = 9; juntos dan 25.',
        feedbackWrong: 'Resuelve cada potencia por separado antes de sumar.',
      },
    ],
    roots: [
      {
        question: '¿Cuánto es √25?',
        answer: '5',
        feedbackCorrect: 'Correcto: 5 × 5 = 25.',
        feedbackWrong: 'Busca qué número multiplicado por sí mismo da 25.',
      },
      {
        question: '¿Cuánto es √81?',
        answer: '9',
        feedbackCorrect: 'Bien: 9 × 9 = 81.',
        feedbackWrong: 'Recuerda los cuadrados perfectos: 9² = 81.',
      },
      {
        question: '√50 está entre qué dos números enteros?',
        answer: '7 y 8',
        accepted: ['7y8', '7,8', '7 8', 'entre7y8'],
        feedbackCorrect: 'Muy bien: 7² = 49 y 8² = 64, así que √50 está entre 7 y 8.',
        feedbackWrong: 'Compara cuadrados cercanos: 7² = 49 y 8² = 64.',
      },
      {
        question: 'Si √x = 6, ¿cuánto vale x?',
        answer: '36',
        feedbackCorrect: 'Exacto: si la raíz es 6, entonces x = 6 × 6 = 36.',
        feedbackWrong: 'Haz la operación inversa: eleva 6 al cuadrado.',
      },
    ],
  };

  function generateChallenge(topic) {
    const pool = quickChallenges[topic] || quickChallenges.arithmetic;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function generateChallengeSet(topic) {
    return challengeSets[topic] || challengeSets.arithmetic;
  }

  return {
    features,
    ageRanges,
    topicsConfig,
    calculatorKeys,
    generateChallenge,
    generateChallengeSet,
  };
})();
