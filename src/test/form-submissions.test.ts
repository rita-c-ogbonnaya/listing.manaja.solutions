import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const invokeMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: invokeMock },
    from: fromMock,
  },
}));

describe("form submissions", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    fromMock.mockReset();
    if (typeof localStorage !== "undefined") localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("routes support requests through the working contact email function", async () => {
    invokeMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });
    const { submitSupportRequest } = await import("@/lib/form-submissions");

    await submitSupportRequest({
      type: "escalation",
      name: "Rita Example",
      email: "rita@example.com",
      company: "Manaja",
      subject: "Live agent request",
      message: "Please connect me with the team.",
      meta: { priority: "High" },
    });

    expect(invokeMock).toHaveBeenCalledWith("send-contact-email", {
      body: expect.objectContaining({
        firstName: "Rita",
        lastName: "Example",
        email: "rita@example.com",
        subject: "[Live agent escalation] Live agent request",
      }),
    });
  });

  it("falls back to email when roadmap table is missing", async () => {
    fromMock.mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        error: {
          code: "PGRST205",
          message:
            "Could not find the table 'public.roadmap_subscribers' in the schema cache",
        },
      }),
    });
    invokeMock.mockResolvedValue({ error: null });
    const { subscribeToRoadmapUpdates } = await import("@/lib/form-submissions");

    const result = await subscribeToRoadmapUpdates("rita@example.com");

    expect(result).toEqual({
      alreadySubscribed: false,
      delivery: "email-fallback",
    });
    expect(invokeMock).toHaveBeenCalledWith("send-contact-email", {
      body: expect.objectContaining({
        email: "rita@example.com",
        subject: "Roadmap updates request",
      }),
    });
  });

  it("queues submissions when offline and surfaces an OfflineQueuedError", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window.navigator,
      "onLine"
    );
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
    try {
      const { submitSupportRequest, getPendingSubmissionsCount, OfflineQueuedError } =
        await import("@/lib/form-submissions");

      await expect(
        submitSupportRequest({
          type: "feature",
          name: "Sam Tester",
          email: "sam@example.com",
          subject: "Offline test",
          message: "Please queue this submission while I am offline.",
        })
      ).rejects.toBeInstanceOf(OfflineQueuedError);

      expect(getPendingSubmissionsCount()).toBe(1);
      expect(invokeMock).not.toHaveBeenCalled();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window.navigator, "onLine", originalDescriptor);
      }
    }
  });
});
