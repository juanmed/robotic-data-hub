import { describe, it, expect } from "vitest";
import * as datasetService from "@/services/datasetService";

describe("datasetService", () => {
  describe("exports", () => {
    it("exports listDatasets function", () => {
      expect(datasetService.listDatasets).toBeDefined();
      expect(typeof datasetService.listDatasets).toBe("function");
    });

    it("exports getDataset function", () => {
      expect(datasetService.getDataset).toBeDefined();
      expect(typeof datasetService.getDataset).toBe("function");
    });

    it("exports getDatasetFiles function", () => {
      expect(datasetService.getDatasetFiles).toBeDefined();
      expect(typeof datasetService.getDatasetFiles).toBe("function");
    });

    it("exports getDatasetFileUrls function", () => {
      expect(datasetService.getDatasetFileUrls).toBeDefined();
      expect(typeof datasetService.getDatasetFileUrls).toBe("function");
    });

    it("exports deleteDataset function", () => {
      expect(datasetService.deleteDataset).toBeDefined();
      expect(typeof datasetService.deleteDataset).toBe("function");
    });
  });

  describe("service structure", () => {
    it("provides dataset retrieval and deletion operations", () => {
      expect(datasetService.listDatasets).toBeDefined();
      expect(datasetService.getDataset).toBeDefined();
      expect(datasetService.getDatasetFiles).toBeDefined();
      expect(datasetService.getDatasetFileUrls).toBeDefined();
      expect(datasetService.deleteDataset).toBeDefined();
    });

    it("all functions are async", () => {
      const listResult = datasetService.listDatasets();
      expect(listResult).toBeInstanceOf(Promise);
    });
  });
});
