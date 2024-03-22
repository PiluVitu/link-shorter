import postgres from "postgres";

//Url: nomedobanco://userDoBanco:senhaDoBanco@portaQueEstáRodando/nomeDoBanco

export const sql = postgres(
  "postgresql://docker:docker@localhost:5432/shortlinks"
);
