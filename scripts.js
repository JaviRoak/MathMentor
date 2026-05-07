/* Motor matemático y lógica de la aplicación */

const { createApp, ref, computed, nextTick, watch } = Vue;

createApp({
  setup() {
    const page = document.body.dataset.page || 'home';

    // Estado
    const currentView = ref(page);
    const selectedAge = ref(page === 'app' ? (localStorage.getItem('mathmentor-age') || '10-11') : null);
    const selectedTopic = ref('arithmetic');
    const expression = ref('');
    const result = ref(null);
    const isLoading = ref(false);
    const errorMsg = ref('');
    const streak = ref(0);
    const history = ref([]);
    const challengeAnswer = ref('');
    const challengeAnswered = ref(false);
    const challengeCorrect = ref(false);
    const mainInput = ref(null);
    const challengeCanvas = ref(null);
    let challengeTimer = null;
    let isDrawingChallenge = false;
    const challengeState = ref({
      mode: 'idle',
      exercises: [],
      topic: null,
      currentIndex: 0,
      answer: '',
      feedback: null,
      correctCount: 0,
      timeLeft: 120,
      startedAt: null,
      finishedAt: null,
      showBoard: false,
      board: '',
      showCalc: false,
      calcDisplay: '',
      calcX: null,
      calcY: null,
      surrendered: false,
      streak: 0,
      bestTime: null,
      lastImprovement: null,
    });

    // Datos
    const {
      features,
      ageRanges,
      topicsConfig,
      calculatorKeys,
      generateChallenge,
      generateChallengeSet,
    } = window.MathMentorData;

    // Valores calculados
    const ageLevelLabel = computed(() => {
      const labels = {
        '10-11': '📗 Nivel Básico',
        '12-13': '📘 Nivel Intermedio',
        '14-15': '📙 Nivel Avanzado',
      };
      return labels[selectedAge.value] || '';
    });

    const availableTopics = computed(() => {
      const base = ['arithmetic', 'fractions', 'percentages'];
      if (selectedAge.value === '12-13' || selectedAge.value === '14-15') {
        base.push('algebra', 'powers');
      }
      if (selectedAge.value === '14-15') {
        base.push('roots');
      }
      return base.map(id => topicsConfig[id]);
    });

    const currentTopicData = computed(() => {
      return topicsConfig[selectedTopic.value] || topicsConfig.arithmetic;
    });

    const challengeTimeLabel = computed(() => {
      const minutes = Math.floor(challengeState.value.timeLeft / 60);
      const seconds = challengeState.value.timeLeft % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });

    const currentChallengeExercise = computed(() => {
      return challengeState.value.exercises[challengeState.value.currentIndex] || null;
    });

    const challengeProgressLabel = computed(() => {
      if (!challengeState.value.exercises.length) return '0/0';
      return `${challengeState.value.currentIndex + 1}/${challengeState.value.exercises.length}`;
    });

    const showChallengeCalculator = computed(() => {
      return challengeState.value.mode === 'active' && challengeState.value.topic !== 'arithmetic';
    });

    // Motor matemático

    // Aritmética con orden de operaciones
    function solveArithmetic(expr) {
      const cleaned = expr.replace(/\s+/g, ' ').trim();
      const tokens = tokenize(cleaned);

      if (!tokens) throw new Error('No pude entender esa expresión. Revisa que esté bien escrita.');

      const steps = [];
      let workingTokens = [...tokens];

      // Primero multiplicaciones y divisiones
      let found = true;
      while (found) {
        found = false;
        for (let i = 0; i < workingTokens.length; i++) {
          if (workingTokens[i] === '×' || workingTokens[i] === '/' ||
              workingTokens[i] === '*' || workingTokens[i] === '÷') {
            const op = workingTokens[i];
            const a = parseFloat(workingTokens[i - 1]);
            const b = parseFloat(workingTokens[i + 1]);
            let res;
            let opName;

            if (op === '×' || op === '*') {
              res = a * b;
              opName = 'multiplicar';
            } else {
              if (b === 0) throw new Error('¡No se puede dividir entre cero!');
              res = a / b;
              opName = 'dividir';
            }

            steps.push({
              operation: `<span class="highlight">${a} ${op === '*' ? '×' : op === '/' || op === '÷' ? '÷' : op} ${b} = ${formatNum(res)}</span>`,
              explanation: `Primero buscamos multiplicaciones o divisiones porque tienen prioridad sobre la suma y la resta. Aquí toca ${opName}: ${a} ${op === '*' ? '×' : op === '/' || op === '÷' ? '÷' : op} ${b} = ${formatNum(res)}. Después reemplazamos solo esa parte por ${formatNum(res)} y seguimos con lo que queda.`,
              visible: true,
            });

            workingTokens.splice(i - 1, 3, formatNum(res));
            found = true;
            break;
          }
        }
      }

      // Luego sumas y restas
      found = true;
      while (found) {
        found = false;
        for (let i = 0; i < workingTokens.length; i++) {
          if (workingTokens[i] === '+' || workingTokens[i] === '-') {
            if (i === 0) continue; // Signo negativo al inicio
            const op = workingTokens[i];
            const a = parseFloat(workingTokens[i - 1]);
            const b = parseFloat(workingTokens[i + 1]);
            let res;

            if (op === '+') {
              res = a + b;
            } else {
              res = a - b;
            }

            steps.push({
              operation: `<span class="highlight">${a} ${op} ${b} = ${formatNum(res)}</span>`,
              explanation: op === '+'
                ? `Ya no quedan multiplicaciones ni divisiones antes de esta parte, así que avanzamos de izquierda a derecha. Sumamos ${a} + ${b}: empezamos en ${a}, agregamos ${b} y llegamos a ${formatNum(res)}.`
                : `Ya no quedan multiplicaciones ni divisiones antes de esta parte, así que avanzamos de izquierda a derecha. Restamos ${a} - ${b}: empezamos en ${a}, quitamos ${b} y llegamos a ${formatNum(res)}.`,
              visible: true,
            });

            workingTokens.splice(i - 1, 3, formatNum(res));
            found = true;
            break;
          }
        }
      }

      const answer = formatNum(parseFloat(workingTokens[0]));
      return {
        answer,
        steps: steps.length > 0 ? steps : [{
          operation: `${expr} = ${answer}`,
          explanation: 'Esta operación es directa, ¡el resultado es inmediato!',
          visible: true,
        }],
        concept: 'Cuando hay varias operaciones, siempre resuelve primero las multiplicaciones y divisiones (de izquierda a derecha) y luego las sumas y restas. Esto se llama "jerarquía de operaciones".',
      };
    }

    function tokenize(expr) {
      const normalized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/x(?![a-z])/gi, (match, offset, str) => {
          // Multiplicación entre números
          const before = str[offset - 1];
          const after = str[offset + 1];
          if (before && before.match(/[0-9)]/) && after && after.match(/[0-9(]/)) {
            return '*';
          }
          return match;
        });

      const tokens = [];
      let current = '';

      for (let i = 0; i < normalized.length; i++) {
        const ch = normalized[i];
        if (ch === ' ') {
          if (current) { tokens.push(current); current = ''; }
          continue;
        }
        if ('+-*/'.includes(ch)) {
          if (current) { tokens.push(current); current = ''; }
          // Signo negativo
          if (ch === '-' && (tokens.length === 0 || '+-*/'.includes(tokens[tokens.length - 1]))) {
            current = '-';
          } else {
            const display = ch === '*' ? '×' : ch === '/' ? '÷' : ch;
            tokens.push(display);
          }
        } else if (ch.match(/[0-9.]/)) {
          current += ch;
        } else {
          return null;
        }
      }
      if (current) tokens.push(current);

      return tokens.length > 0 ? tokens : null;
    }

    // Fracciones
    function solveFractions(expr) {
      const parts = expr.match(/(\d+)\/(\d+)\s*([+\-×\*\/÷])\s*(\d+)\/(\d+)/);
      if (!parts) throw new Error('Formato: a/b + c/d (ej: 1/2 + 3/4)');

      const [, n1, d1, op, n2, d2] = parts;
      const a = { n: parseInt(n1), d: parseInt(d1) };
      const b = { n: parseInt(n2), d: parseInt(d2) };
      const steps = [];

      if (a.d === 0 || b.d === 0) throw new Error('El denominador no puede ser cero.');

      let resultN, resultD;
      const opSymbol = op === '*' ? '×' : op === '÷' ? '/' : op;

      if (op === '+' || op === '-') {
        const lcd = lcm(a.d, b.d);
        const multA = lcd / a.d;
        const multB = lcd / b.d;
        const newA = a.n * multA;
        const newB = b.n * multB;

        steps.push({
          operation: `Denominador común = <span class="highlight">${lcd}</span>`,
          explanation: `Para sumar o restar fracciones, las partes deben tener el mismo tamaño. Por eso buscamos un denominador que sirva para ${a.d} y para ${b.d}. El más pequeño es ${lcd}, porque ${lcd} se puede dividir exactamente entre ambos denominadores.`,
          visible: true,
        });

        steps.push({
          operation: `${lcd} ÷ ${a.d} = <span class="highlight">${multA}</span> y ${lcd} ÷ ${b.d} = <span class="highlight">${multB}</span>`,
          explanation: `Estos números nos dicen cuánto debemos ampliar cada fracción para que su denominador llegue a ${lcd}. La primera fracción se multiplica por ${multA} y la segunda por ${multB}.`,
          visible: true,
        });

        steps.push({
          operation: `${a.n}/${a.d} → <span class="highlight">${newA}/${lcd}</span>`,
          explanation: `Multiplicamos arriba y abajo por el mismo número para no cambiar el valor de la fracción: (${a.n}×${multA})/(${a.d}×${multA}) = ${newA}/${lcd}. Es la misma cantidad, escrita con denominador ${lcd}.`,
          visible: true,
        });

        steps.push({
          operation: `${b.n}/${b.d} → <span class="highlight">${newB}/${lcd}</span>`,
          explanation: `Hacemos lo mismo con la segunda fracción: (${b.n}×${multB})/(${b.d}×${multB}) = ${newB}/${lcd}. Ahora las dos fracciones hablan de partes del mismo tamaño.`,
          visible: true,
        });

        resultN = op === '+' ? newA + newB : newA - newB;
        resultD = lcd;

        steps.push({
          operation: `<span class="highlight">${newA} ${op} ${newB} = ${resultN}</span> → ${resultN}/${resultD}`,
          explanation: op === '+'
            ? `Ahora sí podemos sumar. El denominador ${lcd} se queda igual porque el tamaño de las partes no cambia; solo sumamos cuántas partes hay: ${newA} + ${newB} = ${resultN}.`
            : `Ahora sí podemos restar. El denominador ${lcd} se queda igual porque el tamaño de las partes no cambia; solo restamos cuántas partes hay: ${newA} - ${newB} = ${resultN}.`,
          visible: true,
        });

      } else if (op === '×' || op === '*') {
        resultN = a.n * b.n;
        resultD = a.d * b.d;

        steps.push({
          operation: `Numeradores: <span class="highlight">${a.n} × ${b.n} = ${resultN}</span>`,
          explanation: `En una multiplicación de fracciones, multiplicamos las partes de arriba para saber cuántas partes tomamos: ${a.n} × ${b.n} = ${resultN}.`,
          visible: true,
        });

        steps.push({
          operation: `Denominadores: <span class="highlight">${a.d} × ${b.d} = ${resultD}</span>`,
          explanation: `Luego multiplicamos las partes de abajo para saber en cuántas partes quedó dividido el todo: ${a.d} × ${b.d} = ${resultD}.`,
          visible: true,
        });

      } else if (op === '/' || op === '÷') {
        steps.push({
          operation: `${b.n}/${b.d} → invertir → <span class="highlight">${b.d}/${b.n}</span>`,
          explanation: `Dividir entre una fracción pregunta cuántas veces cabe esa fracción. Para hacerlo más fácil, usamos su recíproco: invertimos la segunda fracción, cambiando numerador y denominador.`,
          visible: true,
        });

        resultN = a.n * b.d;
        resultD = a.d * b.n;

        steps.push({
          operation: `<span class="highlight">${a.n}/${a.d} × ${b.d}/${b.n} = ${resultN}/${resultD}</span>`,
          explanation: `Después de invertir, ya es una multiplicación de fracciones: multiplicamos numeradores (${a.n}×${b.d}) y denominadores (${a.d}×${b.n}) para obtener ${resultN}/${resultD}.`,
          visible: true,
        });
      }

      // Simplificación
      const g = gcd(Math.abs(resultN), Math.abs(resultD));
      if (g > 1) {
        const simpN = resultN / g;
        const simpD = resultD / g;
        steps.push({
          operation: `${resultN}/${resultD} simplificado = <span class="highlight">${simpN}/${simpD}</span>`,
          explanation: `${resultN} y ${resultD} se pueden dividir exactamente entre ${g}. Al dividir ambos por el mismo número, la fracción conserva su valor pero queda más pequeña y fácil de leer.`,
          visible: true,
        });
        resultN = simpN;
        resultD = simpD;
      }

      const answer = resultD === 1 ? `${resultN}` : `${resultN}/${resultD}`;

      return {
        answer,
        steps,
        concept: 'Las fracciones representan partes de un todo. Para sumar o restar, necesitan el mismo denominador. Para multiplicar, se multiplican "en línea". Para dividir, se invierte la segunda y se multiplica.',
      };
    }

    // Álgebra
    function solveAlgebra(expr) {
      if (!expr.includes('=')) throw new Error('Necesito una ecuación con "=". Ejemplo: 2x + 5 = 15');

      const [left, right] = expr.split('=').map(s => s.trim());
      const steps = [];

      // Lee coeficientes y constantes
      const parseSide = (side) => {
        let coeff = 0;
        let constant = 0;
        const normalized = side.replace(/\s+/g, '').replace(/-/g, '+-');
        const terms = normalized.split('+').filter(t => t !== '');

        for (const term of terms) {
          if (term.includes('x')) {
            const c = term.replace('x', '');
            coeff += c === '' || c === '+' ? 1 : c === '-' ? -1 : parseFloat(c);
          } else {
            constant += parseFloat(term);
          }
        }
        return { coeff, constant };
      };

      const formatParsedSide = ({ coeff, constant }) => {
        const terms = [];
        if (coeff !== 0) {
          terms.push(coeff === 1 ? 'x' : coeff === -1 ? '-x' : `${coeff}x`);
        }
        if (constant !== 0 || terms.length === 0) {
          if (terms.length > 0 && constant > 0) {
            terms.push(`+ ${constant}`);
          } else if (terms.length > 0) {
            terms.push(`- ${Math.abs(constant)}`);
          } else {
            terms.push(`${constant}`);
          }
        }
        return terms.join(' ');
      };

      const leftParsed = parseSide(left);
      const rightParsed = parseSide(right);

      steps.push({
        operation: `${left} = ${right}`,
        explanation: `Empezamos con la ecuación original. Nuestro objetivo es descubrir qué número puede tomar "x" para que los dos lados sean iguales.`,
        visible: true,
      });

      steps.push({
        operation: `Lado izquierdo: <span class="highlight">${formatParsedSide(leftParsed)}</span> | lado derecho: <span class="highlight">${formatParsedSide(rightParsed)}</span>`,
        explanation: `Separamos cada lado en dos tipos de términos: los que tienen "x" y los números solos. Así podemos mover cada tipo al lado que conviene.`,
        visible: true,
      });

      // Agrupa las variables
      let xCoeff = leftParsed.coeff - rightParsed.coeff;
      let numSide = rightParsed.constant - leftParsed.constant;

      if (rightParsed.coeff !== 0) {
        steps.push({
          operation: `Mover x: <span class="highlight">${leftParsed.coeff}x - ${rightParsed.coeff}x</span>`,
          explanation: `Quitamos ${rightParsed.coeff}x del lado derecho para que las "x" queden juntas a la izquierda. Para mantener la balanza igual, hacemos esa misma resta en ambos lados. Por eso queda ${formatNum(xCoeff)}x.`,
          visible: true,
        });
      }

      if (leftParsed.constant !== 0) {
        steps.push({
          operation: `Mover números: <span class="highlight">${rightParsed.constant} ${leftParsed.constant > 0 ? '-' : '+'} ${Math.abs(leftParsed.constant)}</span>`,
          explanation: `Ahora quitamos el número que está junto a la x en el lado izquierdo. Si era positivo, lo restamos; si era negativo, lo sumamos. Así los números quedan a la derecha: ${formatNum(numSide)}.`,
          visible: true,
        });
      }

      steps.push({
        operation: `<span class="highlight">${xCoeff}x = ${formatNum(numSide)}</span>`,
        explanation: `Ya juntamos las "x" en un lado y los números en el otro. Esta forma es más simple porque solo falta deshacer la multiplicación que acompaña a x.`,
        visible: true,
      });

      if (xCoeff === 0) {
        if (numSide === 0) {
          return { answer: 'Infinitas soluciones', steps, concept: 'Cuando ambos lados son iguales siempre, cualquier valor de x funciona.' };
        }
        throw new Error('Esta ecuación no tiene solución (los lados nunca pueden ser iguales).');
      }

      const solution = numSide / xCoeff;

      if (xCoeff !== 1) {
        steps.push({
          operation: `x = ${formatNum(numSide)} ÷ ${xCoeff} = <span class="highlight">${formatNum(solution)}</span>`,
          explanation: `${xCoeff}x significa "${xCoeff} por x". Para dejar x sola, hacemos la operación contraria: dividimos ambos lados entre ${xCoeff}. Así obtenemos x = ${formatNum(solution)}.`,
          visible: true,
        });
      }

      // Verificación
      steps.push({
        operation: `Verificación ✓`,
        explanation: `Para revisar el resultado, reemplaza cada x de la ecuación original por ${formatNum(solution)}. Si el lado izquierdo y el derecho dan el mismo número, la solución está correcta.`,
        visible: true,
      });

      return {
        answer: `x = ${formatNum(solution)}`,
        steps,
        concept: 'Resolver una ecuación es como una balanza: lo que haces de un lado, lo haces del otro. El objetivo es "aislar" la variable (dejarla sola).',
      };
    }

    // Porcentajes
    function solvePercentages(expr) {
      const match = expr.match(/(\d+(?:\.\d+)?)\s*%\s*(?:de|of)\s*(\d+(?:\.\d+)?)/i);
      if (!match) throw new Error('Formato: 25% de 200');

      const percent = parseFloat(match[1]);
      const total = parseFloat(match[2]);
      const steps = [];

      steps.push({
        operation: `${percent}% de ${total}`,
        explanation: `Queremos encontrar una parte de ${total}. El ${percent}% significa "${percent} de cada 100", así que primero convertimos ese porcentaje en una cantidad que podamos multiplicar.`,
        visible: true,
      });

      const decimal = percent / 100;
      steps.push({
        operation: `${percent}% = ${percent}/100`,
        explanation: `El signo % ya significa "sobre 100". Por eso ${percent}% se lee como ${percent}/100. Este paso solo cambia la forma de escribirlo; todavía representa la misma parte.`,
        visible: true,
      });

      steps.push({
        operation: `${percent} ÷ 100 = <span class="highlight">${decimal}</span>`,
        explanation: `Ahora hacemos la división para convertir esa fracción en decimal. Dividir entre 100 mueve el punto decimal dos lugares a la izquierda: ${percent} se convierte en ${decimal}.`,
        visible: true,
      });

      const result = decimal * total;
      steps.push({
        operation: `<span class="highlight">${decimal} × ${total} = ${formatNum(result)}</span>`,
        explanation: `La palabra "de" en porcentajes se calcula multiplicando. Entonces tomamos ${decimal} partes de ${total}: ${decimal} × ${total} = ${formatNum(result)}.`,
        visible: true,
      });

      return {
        answer: formatNum(result),
        steps,
        concept: `Porcentaje significa "por cada cien". Así, ${percent}% es como decir "${percent} de cada 100". Para calcularlo: divide el porcentaje entre 100 y multiplica por el total.`,
      };
    }

    // Potencias
    function solvePowers(expr) {
      const match = expr.match(/(\d+(?:\.\d+)?)\s*\^\s*(\d+)/);
      if (!match) throw new Error('Formato: base^exponente (ej: 2^4)');

      const base = parseFloat(match[1]);
      const exp = parseInt(match[2]);
      const steps = [];

      if (exp > 10) throw new Error('Para este nivel, el exponente máximo es 10.');

      steps.push({
        operation: `${base}<sup>${exp}</sup>`,
        explanation: `La base es ${base} y el exponente es ${exp}. El exponente no significa multiplicar ${base} por ${exp}; significa usar ${base} como factor ${exp} veces.`,
        visible: true,
      });

      const parts = Array(exp).fill(base);
      steps.push({
        operation: `<span class="highlight">${parts.join(' × ')}</span>`,
        explanation: `Escribimos la potencia como multiplicación repetida para verla completa: aparecen ${exp} copias de ${base}.`,
        visible: true,
      });

      let accumulated = base;
      for (let i = 1; i < exp; i++) {
        const prev = accumulated;
        accumulated *= base;
        if (exp > 2) {
          steps.push({
            operation: `${formatNum(prev)} × ${base} = <span class="highlight">${formatNum(accumulated)}</span>`,
            explanation: `Multiplicamos de izquierda a derecha. Ya llevábamos ${formatNum(prev)}; ahora usamos otra copia de ${base}: ${formatNum(prev)} × ${base} = ${formatNum(accumulated)}.`,
            visible: true,
          });
        }
      }

      return {
        answer: formatNum(Math.pow(base, exp)),
        steps,
        concept: `Una potencia es una multiplicación repetida. ${base}^${exp} = ${parts.join(' × ')} = ${formatNum(Math.pow(base, exp))}. El número de abajo es la "base" y el de arriba es el "exponente" (cuántas veces se multiplica).`,
      };
    }

    // Raíces cuadradas
    function solveRoots(expr) {
      const match = expr.match(/(?:raiz|sqrt|√)\s*\(?\s*(\d+(?:\.\d+)?)\s*\)?/i);
      if (!match) throw new Error('Formato: raiz(número) o sqrt(número)');

      const num = parseFloat(match[1]);
      if (num < 0) throw new Error('No se puede calcular la raíz cuadrada de un número negativo (en números reales).');

      const steps = [];
      const result = Math.sqrt(num);
      const isExact = Number.isInteger(result);

      steps.push({
        operation: `√${num} = ?`,
        explanation: `Buscamos un número que, multiplicado por sí mismo, dé ${num}. Es decir: ¿qué número cumple ? × ? = ${num}?`,
        visible: true,
      });

      if (isExact) {
        const nearbyRoot = Math.max(0, result - 1);
        steps.push({
          operation: `${nearbyRoot}² = ${nearbyRoot * nearbyRoot} y ${result}² = ${result * result}`,
          explanation: `Probamos cuadrados cercanos para ubicar el número. Como ${result}² llega exactamente a ${num}, encontramos una raíz exacta.`,
          visible: true,
        });

        steps.push({
          operation: `<span class="highlight">${result} × ${result} = ${num}</span>`,
          explanation: `La raíz cuadrada responde "qué número multiplicado por sí mismo da ${num}". Como ${result} × ${result} = ${num}, entonces √${num} = ${result}.`,
          visible: true,
        });
      } else {
        const lower = Math.floor(result);
        const upper = lower + 1;
        const tenths = Math.floor(result * 10) / 10;
        const nextTenth = tenths + 0.1;
        const hundredths = Math.floor(result * 100) / 100;
        const nextHundredth = hundredths + 0.01;
        const thousandths = Math.floor(result * 1000) / 1000;
        const nextThousandth = thousandths + 0.001;
        steps.push({
          operation: `${lower}² = ${lower * lower} y ${upper}² = ${upper * upper}`,
          explanation: `Comparamos con cuadrados perfectos cercanos. ${num} está entre ${lower * lower} y ${upper * upper}, así que su raíz está entre ${lower} y ${upper}.`,
          visible: true,
        });
        steps.push({
          operation: `${formatNum(tenths)}² = ${formatNum(tenths * tenths)} y ${formatNum(nextTenth)}² = ${formatNum(nextTenth * nextTenth)}`,
          explanation: `Ahora probamos con un decimal. Queremos acercarnos a ${num}: ${formatNum(tenths)}² queda ${tenths * tenths < num ? 'por debajo' : 'por encima'} y ${formatNum(nextTenth)}² queda ${nextTenth * nextTenth < num ? 'por debajo' : 'por encima'}, así que la raíz está entre ${formatNum(tenths)} y ${formatNum(nextTenth)}.`,
          visible: true,
        });
        steps.push({
          operation: `${formatNum(hundredths)}² = ${formatNum(hundredths * hundredths)} y ${formatNum(nextHundredth)}² = ${formatNum(nextHundredth * nextHundredth)}`,
          explanation: `Afinamos un poco más. Probamos con dos decimales y vemos que la respuesta está entre ${formatNum(hundredths)} y ${formatNum(nextHundredth)} porque esos cuadrados rodean a ${num}.`,
          visible: true,
        });
        steps.push({
          operation: `${formatNum(thousandths)}² = ${formatNum(thousandths * thousandths)} y ${formatNum(nextThousandth)}² = ${formatNum(nextThousandth * nextThousandth)}`,
          explanation: `Una última prueba con tres decimales nos deja muy cerca. Como ${formatNum(thousandths)}² y ${formatNum(nextThousandth)}² están a los dos lados de ${num}, usamos ${formatNum(result)} como aproximación.`,
          visible: true,
        });
        steps.push({
          operation: `√${num} ≈ <span class="highlight">${formatNum(result)}</span>`,
          explanation: `El símbolo ≈ significa "aproximadamente". No encontramos un número entero que al cuadrado dé ${num}, pero sí encontramos un decimal que se acerca muchísimo.`,
          visible: true,
        });
      }

      return {
        answer: isExact ? `${result}` : `≈ ${formatNum(result)}`,
        steps,
        concept: `La raíz cuadrada es la operación inversa de elevar al cuadrado. Si 5² = 25, entonces √25 = 5. No todos los números tienen raíz cuadrada exacta; los que sí la tienen se llaman "cuadrados perfectos" (1, 4, 9, 16, 25, 36, 49, 64, 81, 100...).`,
      };
    }

    // Utilidades matemáticas
    function gcd(a, b) {
      a = Math.abs(a); b = Math.abs(b);
      while (b) { [a, b] = [b, a % b]; }
      return a;
    }

    function lcm(a, b) {
      return Math.abs(a * b) / gcd(a, b);
    }

    function formatNum(n) {
      if (typeof n === 'string') return n;
      const rounded = Math.round(n * 10000) / 10000;
      return Number.isInteger(rounded) ? rounded.toString() : rounded.toString();
    }

    // Acciones
    function startApp() {
      if (selectedAge.value) {
        localStorage.setItem('mathmentor-age', selectedAge.value);
      }
      window.location.href = 'app.html';
    }

    function goHome() {
      resetChallenge();
      window.location.href = 'index.html';
    }

    function scrollStart() {
      const el = document.getElementById('start');
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' });
      }
    }

    function selectTopic(topicId) {
      selectedTopic.value = topicId;
      result.value = null;
      expression.value = '';
      challengeAnswered.value = false;
      challengeAnswer.value = '';
      resetChallenge();
      nextTick(() => {
        if (mainInput.value) mainInput.value.focus();
      });
    }

    function autoCloseParentheses(expr) {
      let openCount = 0;
      let closeCount = 0;

      for (const ch of expr) {
        if (ch === '(') openCount++;
        if (ch === ')') closeCount++;
      }

      return openCount > closeCount ? expr + ')'.repeat(openCount - closeCount) : expr;
    }

    function normalizeExpression(expr) {
      return autoCloseParentheses(expr.trim());
    }

    // Detecta el motor correcto aunque el usuario escriba algo de otro tema.
    function detectTopic(expr, fallbackTopic) {
      const normalized = expr.toLowerCase();

      if (/^(?:raiz|sqrt|√)/i.test(expr)) return 'roots';
      if (normalized.includes('%')) return 'percentages';
      if (expr.includes('^')) return 'powers';
      if (expr.includes('=') && /x/i.test(expr)) return 'algebra';
      if (/^\s*\d+\/\d+\s*[+\-×*\/÷]\s*\d+\/\d+\s*$/.test(expr)) return 'fractions';

      return fallbackTopic;
    }

    function solve() {
      if (!expression.value.trim()) return;

      isLoading.value = true;
      errorMsg.value = '';
      result.value = null;
      challengeAnswered.value = false;
      challengeAnswer.value = '';

      // Mantiene el cambio visual de "cargando" antes de mostrar el resultado.
      setTimeout(() => {
        try {
          let res;
          const expr = normalizeExpression(expression.value);
          const topic = detectTopic(expr, selectedTopic.value);

          expression.value = expr;

          switch (topic) {
            case 'fractions':
              res = solveFractions(expr);
              break;
            case 'algebra':
              res = solveAlgebra(expr);
              break;
            case 'percentages':
              res = solvePercentages(expr);
              break;
            case 'powers':
              res = solvePowers(expr);
              break;
            case 'roots':
              res = solveRoots(expr);
              break;
            default:
              res = solveArithmetic(expr);
          }

          // Agrega reto
          res.challenge = generateChallenge(topic, selectedAge.value);
          res.topic = topic;
          resetChallenge();

          result.value = res;
          streak.value++;

          // Guarda historial
          history.value.unshift({
            expression: expr,
            answer: res.answer,
            topic,
          });

          // Limita el historial
          if (history.value.length > 20) history.value.pop();

        } catch (e) {
          errorMsg.value = e.message;
          setTimeout(() => { errorMsg.value = ''; }, 5000);
        } finally {
          isLoading.value = false;
        }
      }, 400);
    }

    function resetChallenge() {
      if (challengeTimer) {
        clearInterval(challengeTimer);
        challengeTimer = null;
      }

      challengeState.value = {
        ...challengeState.value,
        mode: 'idle',
        exercises: [],
        topic: null,
        currentIndex: 0,
        answer: '',
        feedback: null,
        correctCount: 0,
        timeLeft: 120,
        startedAt: null,
        finishedAt: null,
        showBoard: false,
        board: '',
        showCalc: false,
        calcDisplay: '',
        calcX: null,
        calcY: null,
        surrendered: false,
        lastImprovement: null,
      };
      isDrawingChallenge = false;
    }

    function startChallenge() {
      const topic = result.value?.topic || selectedTopic.value;
      resetChallenge();

      // Reinicia el reto usando el tema actual y deja lista la pizarra.
      challengeState.value = {
        ...challengeState.value,
        mode: 'active',
        exercises: generateChallengeSet(topic),
        topic,
        currentIndex: 0,
        answer: '',
        feedback: null,
        correctCount: 0,
        timeLeft: 120,
        startedAt: Date.now(),
        finishedAt: null,
        showBoard: true,
        board: '',
        showCalc: topic !== 'arithmetic',
        calcDisplay: '',
        calcX: null,
        calcY: null,
        surrendered: false,
      };

      challengeTimer = setInterval(() => {
        if (challengeState.value.timeLeft <= 1) {
          finishChallenge();
          return;
        }
        challengeState.value.timeLeft--;
      }, 1000);

      nextTick(() => {
        clearChallengeBoard();
      });
    }

    function normalizeAnswer(value) {
      return value
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/,/g, '.');
    }

    function challengeAnswerIsCorrect(exercise, answer) {
      const normalized = normalizeAnswer(answer);
      const accepted = [exercise.answer, ...(exercise.accepted || [])].map(normalizeAnswer);

      // Primero acepta variantes textuales definidas para cada ejercicio.
      if (accepted.includes(normalized)) return true;

      // Luego compara números para tolerar pequeñas diferencias de formato.
      const numericAnswer = Number(normalized);
      const numericCorrect = Number(normalizeAnswer(exercise.answer));
      return Number.isFinite(numericAnswer) &&
        Number.isFinite(numericCorrect) &&
        Math.abs(numericAnswer - numericCorrect) < 0.0001;
    }

    function submitChallengeAnswer() {
      const exercise = currentChallengeExercise.value;
      if (!exercise || !challengeState.value.answer.trim() || challengeState.value.feedback) return;

      const correct = challengeAnswerIsCorrect(exercise, challengeState.value.answer);
      challengeState.value.feedback = {
        correct,
        text: correct ? exercise.feedbackCorrect : exercise.feedbackWrong,
      };

      if (correct) {
        challengeState.value.correctCount++;
        challengeState.value.streak++;
      } else {
        challengeState.value.streak = 0;
      }
    }

    function nextChallengeExercise() {
      if (challengeState.value.currentIndex >= challengeState.value.exercises.length - 1) {
        finishChallenge();
        return;
      }

      challengeState.value.currentIndex++;
      challengeState.value.answer = '';
      challengeState.value.feedback = null;
      challengeState.value.board = '';
      challengeState.value.calcDisplay = '';

      nextTick(() => {
        clearChallengeBoard();
      });
    }

    function finishChallenge() {
      if (challengeTimer) {
        clearInterval(challengeTimer);
        challengeTimer = null;
      }

      // Guarda tiempo y mejor marca solo si el reto quedó completo.
      const elapsed = challengeState.value.startedAt
        ? Math.max(1, Math.round((Date.now() - challengeState.value.startedAt) / 1000))
        : 120 - challengeState.value.timeLeft;

      const previousBest = challengeState.value.bestTime;
      const completedAll = challengeState.value.correctCount === challengeState.value.exercises.length;
      const improvedBy = previousBest && completedAll ? previousBest - elapsed : null;

      challengeState.value = {
        ...challengeState.value,
        mode: 'finished',
        finishedAt: Date.now(),
        lastImprovement: improvedBy && improvedBy > 0 ? improvedBy : null,
        bestTime: completedAll && (!previousBest || elapsed < previousBest) ? elapsed : previousBest,
      };
    }

    function surrenderChallenge() {
      challengeState.value.surrendered = true;
      finishChallenge();
    }

    function insertChallengeCalcKey(key) {
      if (key === '⌫') {
        challengeState.value.calcDisplay = challengeState.value.calcDisplay.slice(0, -1);
      } else if (key === '=') {
        try {
          const calcResult = solveArithmetic(challengeState.value.calcDisplay);
          challengeState.value.calcDisplay = calcResult.answer;
          challengeState.value.answer = calcResult.answer;
        } catch (e) {
          challengeState.value.calcDisplay = '';
        }
      } else if (['+', '-', '×', '/', '÷'].includes(key)) {
        challengeState.value.calcDisplay += ` ${key} `;
      } else {
        challengeState.value.calcDisplay += key;
      }
    }

    function challengeCalcStyle() {
      if (challengeState.value.calcX === null || challengeState.value.calcY === null) return {};
      return {
        left: `${challengeState.value.calcX}px`,
        top: `${challengeState.value.calcY}px`,
        right: 'auto',
      };
    }

    function startChallengeCalcDrag(event) {
      const panel = event.currentTarget.closest('.challenge-calc-panel');
      if (!panel) return;

      // Mueve la calculadora sin dejar que salga de la ventana visible.
      const rect = panel.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      const move = (moveEvent) => {
        const maxX = window.innerWidth - rect.width - 12;
        const maxY = window.innerHeight - rect.height - 12;
        challengeState.value.calcX = Math.min(Math.max(12, moveEvent.clientX - offsetX), Math.max(12, maxX));
        challengeState.value.calcY = Math.min(Math.max(12, moveEvent.clientY - offsetY), Math.max(12, maxY));
      };

      const stop = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
      };

      event.preventDefault();
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stop);
    }

    function getChallengeCanvasPoint(event) {
      const canvas = challengeCanvas.value;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    function prepareChallengeCanvas() {
      const canvas = challengeCanvas.value;
      if (!canvas) return null;

      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#f8fafc';
      return ctx;
    }

    function clearChallengeBoard() {
      const canvas = challengeCanvas.value;
      const ctx = prepareChallengeCanvas();
      if (!canvas || !ctx) return;

      // Redibuja la pizarra desde cero para que siempre arranque limpia.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#080910';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255, 61, 92, 0.16)';
      ctx.lineWidth = 1;

      for (let x = 40; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 40; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 5;
      isDrawingChallenge = false;
    }

    function startChallengeDrawing(event) {
      const ctx = prepareChallengeCanvas();
      if (!ctx) return;

      event.preventDefault();
      const point = getChallengeCanvasPoint(event);
      isDrawingChallenge = true;
      event.target.setPointerCapture?.(event.pointerId);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }

    function drawChallengeLine(event) {
      if (!isDrawingChallenge) return;
      const ctx = prepareChallengeCanvas();
      if (!ctx) return;

      event.preventDefault();
      const point = getChallengeCanvasPoint(event);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    function stopChallengeDrawing(event) {
      if (!isDrawingChallenge) return;
      isDrawingChallenge = false;
      try {
        event?.target?.releasePointerCapture?.(event.pointerId);
      } catch (e) {
        // El navegador puede liberar el puntero al salir del canvas.
      }
    }

    function insertCalculatorKey(key) {
      if (key === '⌫') {
        expression.value = expression.value.slice(0, -1);
      } else if (key === '√') {
        expression.value += expression.value ? ' raiz(' : 'raiz(';
      } else if (key === 'de') {
        expression.value += ' de ';
      } else if (['+', '-', '×', '/', '÷', '=', '^'].includes(key)) {
        expression.value += ` ${key} `;
      } else {
        expression.value += key;
      }

      nextTick(() => {
        if (mainInput.value) mainInput.value.focus();
      });
    }

    function checkChallenge() {
      if (!challengeAnswer.value.trim()) return;
      challengeAnswered.value = true;

      const userAns = challengeAnswer.value.trim().toLowerCase().replace(/\s/g, '');
      const correctAns = result.value.challenge.answer.toLowerCase().replace(/\s/g, '');

      challengeCorrect.value = userAns === correctAns;

      if (challengeCorrect.value) {
        streak.value++;
      }
    }

    function resetProblem() {
      result.value = null;
      expression.value = '';
      challengeAnswered.value = false;
      challengeAnswer.value = '';
      resetChallenge();
      nextTick(() => {
        if (mainInput.value) mainInput.value.focus();
      });
    }

    // Valores expuestos
    return {
      // Estado
      currentView,
      selectedAge,
      selectedTopic,
      expression,
      result,
      isLoading,
      errorMsg,
      streak,
      history,
      challengeAnswer,
      challengeAnswered,
      challengeCorrect,
      challengeState,
      mainInput,
      challengeCanvas,

      // Datos
      features,
      ageRanges,
      topicsConfig,
      calculatorKeys,

      // Valores calculados
      ageLevelLabel,
      availableTopics,
      currentTopicData,
      challengeTimeLabel,
      currentChallengeExercise,
      challengeProgressLabel,
      showChallengeCalculator,

      // Métodos
      startApp,
      goHome,
      scrollStart,
      selectTopic,
      solve,
      insertCalculatorKey,
      startChallenge,
      submitChallengeAnswer,
      nextChallengeExercise,
      surrenderChallenge,
      resetChallenge,
      insertChallengeCalcKey,
      challengeCalcStyle,
      startChallengeCalcDrag,
      clearChallengeBoard,
      startChallengeDrawing,
      drawChallengeLine,
      stopChallengeDrawing,
      checkChallenge,
      resetProblem,
    };
  },
}).mount('#app');
