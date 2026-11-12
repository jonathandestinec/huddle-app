import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/cron/sweep-holds/route";

describe("sweep cron route", () => {
  it("refuses requests without the cron secret", async () => {
    const res = await GET(new Request("http://localhost/api/cron/sweep-holds"));
    expect(res.status).toBe(401);
  });

  it("runs with the cron secret", async () => {
    const res = await GET(
      new Request("http://localhost/api/cron/sweep-holds", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveProperty("released");
  });
});
