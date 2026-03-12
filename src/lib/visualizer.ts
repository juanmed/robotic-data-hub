/**
 * Opens the GamiphyAI dataset visualizer in a new tab.
 */
export function openVisualizer(datasetId: string) {
  const url = `https://viz.gamiphy.ai/?datasetId=${datasetId}`;
  window.open(url, "_blank");
}
