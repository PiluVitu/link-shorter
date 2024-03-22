import console from "console";
import fastify from "fastify";
import postgres from "postgres";
import { z } from "zod";
import { sql } from "./lib/postgres";
import { redis } from "./lib/redis";

const app = fastify();

const PORT = 3333;

app.get("/:code", async (req, reply) => {
  const getLinkSchema = z.object({
    code: z.string().min(3),
  });

  const { code } = getLinkSchema.parse(req.params);

  const result = await sql/*sql*/ `
    SELECT id, original_url
    FROM short_links
    WHERE short_links.code = ${code}
  `;

  if (result.length === 0) {
    return reply.status(404).send({ message: "Link not found" });
  }

  const link = result[0];

  await redis.zIncrBy("metrics", 1, String(link.id));

  return reply.redirect(301, link.original_url);
});

app.get("/api/links", async () => {
  const result = await sql/*sql*/ `
    SELECT *
    FROM short_links
    ORDER BY created_at DESC
    `;

  const link = result[0];

  return result;
});

app.post("/api/links", async (req, reply) => {
  const createLinkSchema = z.object({
    code: z.string().min(3),
    url: z.string().url(),
  });
  const { code, url } = createLinkSchema.parse(req.body);

  try {
    const result = await sql/*sql*/ `
    INSERT INTO short_links (code, original_url)
    VALUES (${code}, ${url})
    RETURNING id
    `;

    const link = result[0];

    return reply.status(201).send({ shortLinkId: link.id });
  } catch (err) {
    if (err instanceof postgres.PostgresError) {
      if (err.code === "23505") {
        return reply.status(400).send({ massage: "Duplicated code!" });
      }
    }
    console.error("🚀 ~ app.post ~ err:", err);

    return reply.status(500).send({ massage: "Internal Error" });
  }
});

app.get("/api/metrics", async () => {
  const result = await redis.zRangeByScoreWithScores("metrics", 0, 50);

  const metrics = result
    .sort((a, b) => b.score - a.score)
    .map((item) => {
      return {
        shortLinkId: Number(item.value),
        clicks: item.score,
      };
    });

  return metrics;
});

app.listen({ port: PORT }).then(() => {
  console.log("🚀 Server rodando na", PORT);
});
