import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAuditEntry,
  resolveAuditAction,
} from "./audit";

describe("resolveAuditAction", () => {
  it("maps email sign-in to login", () => {
    assert.deepEqual(resolveAuditAction("/sign-in/email"), {
      action: "login",
    });
  });

  it("maps OAuth callbacks to login", () => {
    assert.deepEqual(resolveAuditAction("/callback/google"), {
      action: "login",
    });
  });

  it("maps set-role to role_changed with target and role flags", () => {
    assert.deepEqual(resolveAuditAction("/admin/set-role"), {
      action: "role_changed",
      hasTargetUser: true,
      hasRoleChange: true,
    });
  });

  it("maps admin password set to password_reset_by_admin", () => {
    assert.deepEqual(resolveAuditAction("/admin/set-user-password"), {
      action: "password_reset_by_admin",
      hasTargetUser: true,
    });
  });

  it("maps ban and unban endpoints", () => {
    assert.deepEqual(resolveAuditAction("/admin/ban-user"), {
      action: "user_banned",
      hasTargetUser: true,
    });
    assert.deepEqual(resolveAuditAction("/admin/unban-user"), {
      action: "user_unbanned",
      hasTargetUser: true,
    });
  });

  it("maps self-serve reset endpoints", () => {
    assert.deepEqual(resolveAuditAction("/request-password-reset"), {
      action: "password_reset_requested",
    });
    assert.deepEqual(resolveAuditAction("/reset-password"), {
      action: "password_reset_self",
    });
  });

  it("returns null for unrelated paths", () => {
    assert.equal(resolveAuditAction("/get-session"), null);
  });
});

describe("buildAuditEntry", () => {
  it("records actor, target, and from/to metadata for a role change", () => {
    const entry = buildAuditEntry({
      action: "role_changed",
      actorId: "admin-1",
      actorEmail: "admin@example.com",
      targetUserId: "user-1",
      targetEmail: "user@example.com",
      metadata: { from: "user", to: "admin" },
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
    });

    assert.equal(entry.action, "role_changed");
    assert.equal(entry.actorId, "admin-1");
    assert.equal(entry.actorEmail, "admin@example.com");
    assert.equal(entry.targetUserId, "user-1");
    assert.equal(entry.targetEmail, "user@example.com");
    assert.deepEqual(entry.metadata, { from: "user", to: "admin" });
    assert.equal(entry.ipAddress, "127.0.0.1");
    assert.equal(entry.userAgent, "test-agent");
  });
});
