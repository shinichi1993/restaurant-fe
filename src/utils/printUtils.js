/**
 * Mở PDF blob trong tab mới và gọi print
 */
export const openPdfAndPrint = (blob) => {
  const url = window.URL.createObjectURL(blob);
  const win = window.open(url);

  if (!win) return;

  win.onload = () => {
    win.focus();
    win.print();
  };
};
