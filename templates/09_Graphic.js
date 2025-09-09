const { createCanvas } = require('canvas');

/**
 * Zeichnet Text auf ein Hintergrundbild (Canvas/Image)
 * Keine Worttrennung: Wörter bleiben intakt; Schrift wird ggf. verkleinert.
 * Falls selbst bei Minimalgröße nicht alles passt, wird am Ende mit "…" sauber
 * abgeschnitten (ohne Wörter zu zerstückeln).
 */
module.exports = async function generateGraphicText(
  img,
  overlayText,
  targetWidth = 1000,
  targetHeight = 1500,
  website = ''
) {
  const WIDTH = targetWidth;
  const HEIGHT = targetHeight;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // === 1) Hintergrund übernehmen ===
  if (img && img.width && img.height) {
    ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
  }

  // === 2) Textbox-Bereich ===
  const BOX_H = Math.round(HEIGHT * 0.70);
  const BOX_W = Math.round(WIDTH * 0.86);
  const BOX_X = Math.round((WIDTH - BOX_W) / 2);
  const BOX_Y = Math.round((HEIGHT - BOX_H) / 2);

  const maxLinesCap = 6;
  let best = { size: 0, lines: [], lineHeight: 0, totalHeight: 0 };

  // Wir merken uns das zuletzt erfolgreiche (auch wenn nicht "full") Ergebnis
  let lastAttempt = null;

  // Schriftgröße iterativ anpassen: von groß nach klein
  for (let size = 200; size >= 12; size -= 2) {
    ctx.font = `italic 900 ${size}px "Open Sans"`;
    const lineHeight = Math.round(size * 1.18);
    const maxLines = Math.max(1, Math.min(Math.floor(BOX_H / lineHeight), maxLinesCap));

    const result = wrapTextNoHyphen(ctx, overlayText, BOX_W, maxLines);
    // Speichere letzten Versuch mit tatsächlichen Linien (falls vorhanden)
    if (result.lines && result.lines.length) {
      lastAttempt = { size, lines: result.lines.slice(), lineHeight };
    }

    // Falls ein Wort zu breit für diese Schriftgröße ist, weiter verkleinern
    if (result.tooLongWord) {
      continue;
    }

    // Wenn alles vollständig untergebracht ist -> Best-Fit gefunden
    if (result.full && result.lines.length <= maxLines) {
      const totalH = result.lines.length * lineHeight;
      if (totalH <= BOX_H) {
        best = { size, lines: result.lines, lineHeight, totalHeight: totalH };
        break;
      }
    }
  }

  // Fallback: Falls kein "perfect fit" gefunden wurde
  if (!best.size) {
    if (!lastAttempt) {
      // absolut kein Ergebnis (leerer Text?)
      lastAttempt = { size: 12, lines: [], lineHeight: Math.round(12 * 1.18) };
    }

    // Versuche, die vorhandenen letzten Linien auf maxLines zu trimmen,
    // und setze bei Bedarf eine Ellipsis auf die letzte Zeile.
    ctx.font = `italic 900 ${lastAttempt.size}px "Open Sans"`;
    const lineHeight = lastAttempt.lineHeight;
    const maxLines = Math.max(1, Math.min(Math.floor(BOX_H / lineHeight), maxLinesCap));

    let finalLines = lastAttempt.lines.slice(0, maxLines);

    // Wenn original mehr Text existierte (also nicht full), dann die letzte Zeile mit Ellipsis versehen
    // oder falls wir überhaupt Zeichen weggelassen haben.
    const wrappedFullCheck = wrapTextNoHyphen(ctx, overlayText, BOX_W, 1000); // check, ob full overall possible at this size
    if (!wrappedFullCheck.full) {
      // sicherstellen, dass die letzte Zeile mit Ellipsis passt
      if (finalLines.length) {
        finalLines[finalLines.length - 1] = fitWithEllipsis(ctx, finalLines[finalLines.length - 1], BOX_W);
      }
    } else {
      // falls wrappedFullCheck.full true, but we sliced because of maxLines, add ellipsis as well
      if (lastAttempt.lines.length > maxLines && finalLines.length) {
        finalLines[finalLines.length - 1] = fitWithEllipsis(ctx, finalLines[finalLines.length - 1], BOX_W);
      }
    }

    const totalH = finalLines.length * lineHeight;
    best = { size: lastAttempt.size, lines: finalLines, lineHeight, totalHeight: totalH };
  }

  // === 3) Text zeichnen (zentriert in der Box) ===
  ctx.font = `italic 900 ${best.size}px "Open Sans"`;
  const startY = BOX_Y + Math.round((BOX_H - best.totalHeight) / 2);
  const centerX = Math.round(WIDTH / 2);

  // Shadow + Outline + Fill
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const gradient = ctx.createLinearGradient(0, startY, 0, startY + Math.max(best.totalHeight, 1));
  gradient.addColorStop(0, '#555555');
  gradient.addColorStop(1, '#555555');
  ctx.fillStyle = gradient;

  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 3;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  best.lines.forEach((line, i) => {
    const y = startY + i * best.lineHeight;
    ctx.strokeText(line, centerX, y);
    ctx.fillText(line, centerX, y);
  });

  // Shadow deaktivieren
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // === 4) Website einfügen ===
  const urlText = (website && website.trim() ? website : 'www.montessori-helden.de').toUpperCase();
  const urlFontSize = 42;
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  const urlWidth = ctx.measureText(urlText).width + 160;
  const urlHeight = urlFontSize * 1.6;
  const urlX = (WIDTH - urlWidth) / 2;
  const urlY = HEIGHT - urlHeight - 60;

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  roundRect(ctx, urlX, urlY, urlWidth, urlHeight, urlHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#555555';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, WIDTH / 2, urlY + urlHeight / 2);

  return canvas;
};

/* ======== Helfer: Wrap ohne Worttrennung (returns metadata) ========
   Rückgabe-Objekt:
   { lines: [...], full: boolean, tooLongWord: boolean }
   - full = true, wenn alle Wörter untergebracht wurden (ohne Kürzen)
   - tooLongWord = true, wenn ein einzelnes Wort länger als maxWidth ist (bei dieser Schriftgröße)
*/
function wrapTextNoHyphen(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWidth = ctx.measureText(word).width;

    // Ein einzelnes Wort passt nicht in die Box -> signalisiere, dass Größe zu groß ist
    if (wordWidth > maxWidth) {
      return { lines: [], full: false, tooLongWord: true };
    }

    if (!current) {
      current = word;
      continue;
    }

    const test = current + ' ' + word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      // neue Zeile beginnen
      lines.push(current);
      current = word;

      // Wenn wir bereits maxLines Zeilen haben, und noch Wörter übrig sind, -> nicht full
      if (lines.length >= maxLines) {
        return { lines: [], full: false, tooLongWord: false };
      }
    }
  }

  // letzte Zeile hinzufügen
  if (current) lines.push(current);

  // Prüfen, ob wir die erlaubte Zeilenanzahl überschritten haben
  if (lines.length > maxLines) {
    return { lines: [], full: false, tooLongWord: false };
  }

  return { lines, full: true, tooLongWord: false };
}

/* Trimmt eine Zeile so, dass 'line + ellipsis' in maxWidth passt.
   Entfernt ganze Wörter; falls ein einzelnes Wort trotzdem zu breit ist (sehr selten),
   wird es zeichenweise gekürzt (äußerste Ausnahme).
*/
function fitWithEllipsis(ctx, line, maxWidth) {
  const ell = '…';
  if (ctx.measureText(line + ell).width <= maxWidth) return line + ell;

  const words = line.split(' ').filter(Boolean);
  // Entferne Wort für Wort von hinten, bis es passt
  while (words.length > 1) {
    words.pop();
    const candidate = words.join(' ');
    if (ctx.measureText(candidate + ell).width <= maxWidth) {
      return candidate + ell;
    }
  }

  // Noch immer nicht passend -> harte Zeichenkürzung der letzten verbleibenden "Wort"-Zeichen
  let single = words.length ? words[0] : '';
  while (single.length > 0 && ctx.measureText(single + ell).width > maxWidth) {
    single = single.slice(0, -1);
  }
  return single.length ? single + ell : ell;
}

/* === Helper: Runde Rechtecke für URL-Balken === */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
