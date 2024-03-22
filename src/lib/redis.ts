import { createClient } from "redis";

//Banco para lidar com cache e evitar sobrecarga do banco relacional

export const redis = createClient({
  url: "redis://:docker@localhost:6379",
});

redis.connect();
