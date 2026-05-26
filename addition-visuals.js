/* Visualizaciones para operaciones por columnas. */

(function () {
  const placeLabels = ['unidades', 'decenas', 'centenas', 'millares'];

  function placeLabel(indexFromRight) {
    return placeLabels[indexFromRight] || `10^${indexFromRight}`;
  }

  function canBuildVisual(a, b, result) {
    return (
      Number.isInteger(a) &&
      Number.isInteger(b) &&
      Number.isInteger(result) &&
      a >= 0 &&
      b >= 0 &&
      result >= 0 &&
      Math.max(a, b, result) <= 999999999
    );
  }

  function buildAdditionVisual(a, b, result) {
    if (!canBuildVisual(a, b, result)) return null;

    const width = Math.max(String(a).length, String(b).length, String(result).length);
    const topPadding = width - String(a).length;
    const bottomPadding = width - String(b).length;
    const topDigits = String(a).padStart(width, '0').split('').map(Number);
    const bottomDigits = String(b).padStart(width, '0').split('').map(Number);
    const resultDigits = String(result).padStart(width, '0').split('').map(Number);
    const columns = [];
    let carry = 0;

    for (let i = width - 1; i >= 0; i--) {
      const indexFromRight = width - 1 - i;
      const raw = topDigits[i] + bottomDigits[i] + carry;
      const digit = raw % 10;
      const carryOut = Math.floor(raw / 10);

      columns.unshift({
        place: placeLabel(indexFromRight),
        top: topDigits[i],
        bottom: bottomDigits[i],
        topDisplay: i < topPadding ? '' : topDigits[i],
        bottomDisplay: i < bottomPadding ? '' : bottomDigits[i],
        result: resultDigits[i],
        carryIn: carry,
        carryDisplay: carry || '',
        carryOut,
        raw,
        digit,
        delay: `${indexFromRight * 0.9}s`,
      });

      carry = carryOut;
    }

    return {
      top: a,
      bottom: b,
      result,
      columns,
    };
  }

  function buildSubtractionVisual(a, b, result) {
    if (!canBuildVisual(a, b, result) || a < b) return null;

    const width = Math.max(String(a).length, String(b).length, String(result).length);
    const topPadding = width - String(a).length;
    const bottomPadding = width - String(b).length;
    const topOriginal = String(a).padStart(width, '0').split('').map(Number);
    const topWorking = [...topOriginal];
    const bottomDigits = String(b).padStart(width, '0').split('').map(Number);
    const resultDigits = String(result).padStart(width, '0').split('').map(Number);
    const columns = new Array(width);

    for (let i = width - 1; i >= 0; i--) {
      const indexFromRight = width - 1 - i;
      const beforeBorrow = topWorking[i];
      let borrowed = false;

      if (topWorking[i] < bottomDigits[i]) {
        let lender = i - 1;
        while (lender >= 0 && topWorking[lender] === 0) lender--;

        if (lender < 0) return null;

        topWorking[lender] -= 1;
        for (let k = lender + 1; k < i; k++) {
          topWorking[k] += 9;
        }
        topWorking[i] += 10;
        borrowed = true;
      }

      const raw = topWorking[i] - bottomDigits[i];

      columns[i] = {
        place: placeLabel(indexFromRight),
        top: topOriginal[i],
        bottom: bottomDigits[i],
        topDisplay: i < topPadding ? '' : topOriginal[i],
        adjustedTop: topWorking[i],
        adjustedTopDisplay: i < topPadding ? '' : topWorking[i],
        bottomDisplay: i < bottomPadding ? '' : bottomDigits[i],
        result: resultDigits[i],
        borrowed,
        wasReduced: topWorking[i] !== topOriginal[i] && !borrowed,
        borrowDisplay: borrowed ? '+10' : '',
        beforeBorrow,
        raw,
        delay: `${indexFromRight * 0.9}s`,
      };
    }

    return {
      top: a,
      bottom: b,
      result,
      columns,
    };
  }

  function fallbackExplanation(a, b, result, hadPriorityOps, formatNum) {
    if (hadPriorityOps) {
      return `Despues de resolver las multiplicaciones o divisiones, seguimos con la suma. Sumamos ${a} + ${b}: empezamos en ${a}, agregamos ${b} y llegamos a ${formatNum(result)}.`;
    }

    return `Esta es una suma directa. Sumamos ${a} + ${b}: empezamos en ${a}, agregamos ${b} y llegamos a ${formatNum(result)}.`;
  }

  function subtractionFallbackExplanation(a, b, result, hadPriorityOps, formatNum) {
    if (hadPriorityOps) {
      return `Despues de resolver las multiplicaciones o divisiones, seguimos con la resta. Restamos ${a} - ${b}: empezamos en ${a}, quitamos ${b} y llegamos a ${formatNum(result)}.`;
    }

    return `Esta es una resta directa. Restamos ${a} - ${b}: empezamos en ${a}, quitamos ${b} y llegamos a ${formatNum(result)}.`;
  }

  function describeAddition(a, b, result, hadPriorityOps, formatNum) {
    const visual = buildAdditionVisual(a, b, result);

    if (!visual) {
      return {
        explanation: fallbackExplanation(a, b, result, hadPriorityOps, formatNum),
        additionVisual: null,
      };
    }

    const firstColumn = visual.columns[visual.columns.length - 1];
    const prefix = hadPriorityOps
      ? 'Despues de resolver las multiplicaciones o divisiones, seguimos con la suma.'
      : 'Esta suma se resuelve por columnas.';
    const carryText = firstColumn.carryOut
      ? `Como ${firstColumn.raw} tiene dos cifras, escribimos ${firstColumn.digit} y llevamos ${firstColumn.carryOut}.`
      : `Escribimos ${firstColumn.digit} en las unidades.`;

    return {
      explanation: `${prefix} Primero sumamos las unidades: ${firstColumn.top} + ${firstColumn.bottom} = ${firstColumn.raw}. ${carryText} Luego seguimos hacia la izquierda hasta formar ${formatNum(result)}.`,
      additionVisual: visual,
    };
  }

  function describeSubtraction(a, b, result, hadPriorityOps, formatNum) {
    const visual = buildSubtractionVisual(a, b, result);

    if (!visual) {
      return {
        explanation: subtractionFallbackExplanation(a, b, result, hadPriorityOps, formatNum),
        subtractionVisual: null,
      };
    }

    const firstColumn = visual.columns[visual.columns.length - 1];
    const prefix = hadPriorityOps
      ? 'Despues de resolver las multiplicaciones o divisiones, seguimos con la resta.'
      : 'Esta resta se resuelve por columnas.';
    const borrowText = firstColumn.borrowed
      ? `Como ${firstColumn.beforeBorrow} no alcanza para quitar ${firstColumn.bottom}, pedimos prestado y queda ${firstColumn.adjustedTop}. Entonces ${firstColumn.adjustedTop} - ${firstColumn.bottom} = ${firstColumn.raw}.`
      : `En las unidades hacemos ${firstColumn.adjustedTop} - ${firstColumn.bottom} = ${firstColumn.raw}.`;

    return {
      explanation: `${prefix} Empezamos por las unidades. ${borrowText} Luego seguimos hacia la izquierda hasta formar ${formatNum(result)}.`,
      subtractionVisual: visual,
    };
  }

  function buildDivisionVisual(dividend, divisor) {
    if (
      !Number.isInteger(dividend) ||
      !Number.isInteger(divisor) ||
      dividend < 0 ||
      divisor <= 0 ||
      Math.max(dividend, divisor) > 999999999
    ) {
      return null;
    }

    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    const dividendText = String(dividend);
    const divisorText = String(divisor);
    const dividendDigits = dividendText.split('').map(Number);
    const steps = [];
    let working = 0;
    let quotientStarted = false;
    let quotientDigits = '';

    for (let i = 0; i < dividendDigits.length; i++) {
      working = working * 10 + dividendDigits[i];
      const qDigit = Math.floor(working / divisor);
      const product = qDigit * divisor;
      const afterSubtract = working - product;

      if (qDigit > 0 || quotientStarted || i === dividendDigits.length - 1) {
        quotientStarted = true;
        quotientDigits += String(qDigit);
        const currentText = String(working);
        const productText = String(product);
        const currentStart = Math.max(0, i - currentText.length + 1);
        const productStart = Math.max(0, i - productText.length + 1);
        steps.push({
          brought: dividendDigits[i],
          current: working,
          currentText,
          currentStart,
          qDigit,
          product,
          productText,
          productStart,
          remainder: afterSubtract,
          remainderText: String(afterSubtract),
          remainderStart: Math.max(0, i - String(afterSubtract).length + 1),
          delay: `${steps.length * 0.9}s`,
        });
      }

      working = afterSubtract;
    }

    return {
      dividend,
      dividendText,
      divisor,
      divisorText,
      quotient,
      quotientDisplay: quotientDigits || '0',
      quotientWidth: Math.max(dividendText.length, String(quotient).length),
      remainder,
      exact: remainder === 0,
      steps,
    };
  }

  function describeDivision(dividend, divisor, result, formatNum) {
    const visual = buildDivisionVisual(dividend, divisor);

    if (!visual) {
      return {
        explanation: `Primero buscamos multiplicaciones o divisiones porque tienen prioridad sobre la suma y la resta. Aqui toca dividir: ${dividend} ÷ ${divisor} = ${formatNum(result)}. Despues reemplazamos solo esa parte por ${formatNum(result)} y seguimos con lo que queda.`,
        divisionVisual: null,
      };
    }

    const endText = visual.exact
      ? `La division es exacta: no sobra nada.`
      : `Sobran ${visual.remainder}, por eso tambien podemos escribir ${visual.quotient} residuo ${visual.remainder}.`;

    return {
      explanation: `Usamos la casita de division: ${visual.divisor} queda afuera y ${visual.dividend} adentro. Buscamos cuantas veces cabe ${visual.divisor}; el cociente es ${visual.quotientDisplay}. ${endText}`,
      divisionVisual: visual,
    };
  }

  window.MathMentorAddition = {
    buildAdditionVisual,
    buildSubtractionVisual,
    buildDivisionVisual,
    describeAddition,
    describeSubtraction,
    describeDivision,
  };
})();
