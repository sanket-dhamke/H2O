// Web: open the receipt in a new window and trigger the print dialog so the
// user can Save as PDF / print. Falls back to downloading an .html file if the
// popup is blocked.
export async function downloadReceipt(html, filename) {
  const w = typeof window !== "undefined" ? window.open("", "_blank") : null;
  if (w && w.document) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    // Give the browser a moment to lay out before opening the print dialog.
    setTimeout(() => {
      try {
        w.print();
      } catch {
        /* user can still print manually */
      }
    }, 500);
    return;
  }

  // Popup blocked -> download the receipt as a standalone HTML file.
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
