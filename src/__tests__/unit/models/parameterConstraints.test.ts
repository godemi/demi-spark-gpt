import { describe, it, expect } from "vitest";
import {
  PARAMETER_CONSTRAINTS,
  ParameterConstraintSchema,
  ParameterName,
} from "../../../models/parameterConstraints";

/**
 * Unit tests for parameter constraints
 */
describe("PARAMETER_CONSTRAINTS", () => {
  it("should have constraints for all expected parameters", () => {
    const expectedParams = [
      "best_of",
      "frequency_penalty",
      "max_tokens",
      "min_tokens",
      "n",
      "presence_penalty",
      "temperature",
      "top_p",
      "history_window",
      "max_history_tokens",
    ];

    for (const param of expectedParams) {
      expect(PARAMETER_CONSTRAINTS).toHaveProperty(param);
      expect(PARAMETER_CONSTRAINTS[param]).toBeDefined();
    }
  });

  it("should have valid constraint structure for each parameter", () => {
    for (const [name, constraint] of Object.entries(PARAMETER_CONSTRAINTS)) {
      expect(constraint).toHaveProperty("min");
      expect(constraint).toHaveProperty("max");
      expect(constraint).toHaveProperty("type");
      expect(constraint).toHaveProperty("description");
      expect(typeof constraint.min).toBe("number");
      expect(constraint.max === null || typeof constraint.max === "number").toBe(true);
      expect(["int", "float"]).toContain(constraint.type);
      expect(typeof constraint.description).toBe("string");
      expect(constraint.description.length).toBeGreaterThan(0);
    }
  });

  it("should have temperature constraint between 0 and 2", () => {
    const temp = PARAMETER_CONSTRAINTS.temperature;
    expect(temp.min).toBe(0.0);
    expect(temp.max).toBe(2.0);
    expect(temp.type).toBe("float");
  });

  it("should have top_p constraint between 0 and 1", () => {
    const topP = PARAMETER_CONSTRAINTS.top_p;
    expect(topP.min).toBe(0.0);
    expect(topP.max).toBe(1.0);
    expect(topP.type).toBe("float");
  });

  it("should have max_tokens constraint with valid range", () => {
    const maxTokens = PARAMETER_CONSTRAINTS.max_tokens;
    expect(maxTokens.min).toBe(1);
    expect(maxTokens.max).toBe(32768);
    expect(maxTokens.type).toBe("int");
  });

  it("should have frequency_penalty constraint between -2 and 2", () => {
    const freqPenalty = PARAMETER_CONSTRAINTS.frequency_penalty;
    expect(freqPenalty.min).toBe(-2.0);
    expect(freqPenalty.max).toBe(2.0);
    expect(freqPenalty.type).toBe("float");
  });

  it("should have presence_penalty constraint between -2 and 2", () => {
    const presPenalty = PARAMETER_CONSTRAINTS.presence_penalty;
    expect(presPenalty.min).toBe(-2.0);
    expect(presPenalty.max).toBe(2.0);
    expect(presPenalty.type).toBe("float");
  });

  it("should have n constraint with minimum 1", () => {
    const n = PARAMETER_CONSTRAINTS.n;
    expect(n.min).toBe(1);
    expect(n.max).toBeNull();
    expect(n.type).toBe("int");
  });

  it("should have best_of constraint with minimum 2", () => {
    const bestOf = PARAMETER_CONSTRAINTS.best_of;
    expect(bestOf.min).toBe(2);
    expect(bestOf.max).toBeNull();
    expect(bestOf.type).toBe("int");
  });

  it("should have history_window constraint between 1 and 100", () => {
    const historyWindow = PARAMETER_CONSTRAINTS.history_window;
    expect(historyWindow.min).toBe(1);
    expect(historyWindow.max).toBe(100);
    expect(historyWindow.type).toBe("int");
  });

  it("should have max_history_tokens constraint with valid range", () => {
    const maxHistoryTokens = PARAMETER_CONSTRAINTS.max_history_tokens;
    expect(maxHistoryTokens.min).toBe(32);
    expect(maxHistoryTokens.max).toBe(32768);
    expect(maxHistoryTokens.type).toBe("int");
  });
});

describe("ParameterConstraintSchema", () => {
  it("should validate a valid constraint", () => {
    const constraint = {
      min: 0,
      max: 2,
      type: "float",
      description: "Test constraint",
    };
    const result = ParameterConstraintSchema.safeParse(constraint);
    expect(result.success).toBe(true);
  });

  it("should validate constraint with null max", () => {
    const constraint = {
      min: 1,
      max: null,
      type: "int",
      description: "Unbounded constraint",
    };
    const result = ParameterConstraintSchema.safeParse(constraint);
    expect(result.success).toBe(true);
  });

  it("should reject constraint with invalid type", () => {
    const constraint = {
      min: 0,
      max: 2,
      type: "invalid",
      description: "Test",
    };
    const result = ParameterConstraintSchema.safeParse(constraint);
    expect(result.success).toBe(false);
  });

  it("should reject constraint missing required fields", () => {
    const constraint = {
      min: 0,
      // Missing max, type, description
    };
    const result = ParameterConstraintSchema.safeParse(constraint);
    expect(result.success).toBe(false);
  });

  it("should validate all constraints in PARAMETER_CONSTRAINTS", () => {
    for (const [name, constraint] of Object.entries(PARAMETER_CONSTRAINTS)) {
      const result = ParameterConstraintSchema.safeParse(constraint);
      expect(result.success).toBe(true);
    }
  });
});

describe("ParameterName type", () => {
  it("should have correct type for parameter names", () => {
    const paramName: ParameterName = "temperature";
    expect(typeof paramName).toBe("string");
    expect(PARAMETER_CONSTRAINTS).toHaveProperty(paramName);
  });
});

