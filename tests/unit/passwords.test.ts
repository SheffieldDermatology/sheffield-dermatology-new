import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, passwordMeetsPolicy } from "@/lib/auth/passwords";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("CorrectHorse12!");
    expect(await verifyPassword("CorrectHorse12!", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("CorrectHorse12!");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces distinct hashes for the same password (random salt)", async () => {
    const a = await hashPassword("SamePassword12!");
    const b = await hashPassword("SamePassword12!");
    expect(a).not.toBe(b);
  });

  it("rejects a malformed stored hash", async () => {
    expect(await verifyPassword("anything", "not-a-valid-hash")).toBe(false);
  });
});

describe("password policy", () => {
  it("accepts a strong password", () => {
    expect(passwordMeetsPolicy("CorrectHorse12!").ok).toBe(true);
  });
  it("rejects a short password", () => {
    expect(passwordMeetsPolicy("Ab1!").ok).toBe(false);
  });
  it("rejects low-complexity passwords", () => {
    expect(passwordMeetsPolicy("alllowercaseletters").ok).toBe(false);
  });
});
