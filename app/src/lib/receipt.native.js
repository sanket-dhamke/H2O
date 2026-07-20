import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// Native: render the HTML to a real PDF, then open the share/save sheet so the
// resident can store it in Files, send via WhatsApp/email, etc.
export async function downloadReceipt(html, filename) {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: filename,
      UTI: "com.adobe.pdf",
    });
  }
  return uri;
}
